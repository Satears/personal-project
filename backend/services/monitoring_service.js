// 监控服务实现 - monitoring_service.js
// 用途：收集和分析系统指标，实现监控告警功能

const os = require('os');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const monitoringConfig = require('../config/monitoring_config');

// 全局状态
const metricsHistory = {};
const alerts = [];
let isMonitoringActive = false;

// 日志函数
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // 控制台日志
  if (monitoringConfig.logging.console.enabled) {
    if (monitoringConfig.logging.console.colorize) {
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m', // green
        warn: '\x1b[33m', // yellow
        error: '\x1b[31m', // red
        reset: '\x1b[0m', // reset
      };
      console.log(`${colors[level] || colors.info}${logMessage}${colors.reset}`);
    } else {
      console.log(logMessage);
    }
  }
  
  // 文件日志
  if (monitoringConfig.logging.file.enabled) {
    try {
      const logDir = path.dirname(monitoringConfig.logging.file.path);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(monitoringConfig.logging.file.path, logMessage + '\n');
      // 这里可以添加日志文件轮转逻辑
    } catch (error) {
      console.error('无法写入日志文件:', error.message);
    }
  }
  
  // Sentry日志（如果启用）
  if (monitoringConfig.logging.sentry.enabled && monitoringConfig.logging.sentry.dsn) {
    // 这里应该集成Sentry SDK
    // Sentry.captureMessage(message, { level });
  }
}

// 收集服务器指标
function collectServerMetrics() {
  const metrics = {};
  
  try {
    // CPU使用率（简化计算）
    const cpus = os.cpus();
    const totalIdle = cpus.reduce((sum, cpu) => sum + cpu.times.idle, 0);
    const totalTick = cpus.reduce((sum, cpu) => {
      return sum + Object.values(cpu.times).reduce((tickSum, tick) => tickSum + tick, 0);
    }, 0);
    const cpuUsage = 100 - (totalIdle / totalTick * 100);
    
    // 内存使用率
    const memInfo = os.freemem() / os.totalmem() * 100;
    const memoryUsage = 100 - memInfo;
    
    // 磁盘空间（简单版本，检查主分区）
    const diskUsage = 0; // 在实际环境中，可以使用 fs.statfs 或其他库获取
    
    metrics.server_cpu_usage = Math.round(cpuUsage);
    metrics.server_memory_usage = Math.round(memoryUsage);
    metrics.server_disk_space = diskUsage;
    
  } catch (error) {
    log(`收集服务器指标失败: ${error.message}`, 'error');
  }
  
  return metrics;
}

// 收集API指标（模拟，实际应从应用日志或数据库中获取）
function collectApiMetrics() {
  const metrics = {};
  
  try {
    // 模拟数据，实际应该从应用收集
    metrics.api_response_time = Math.floor(Math.random() * 200) + 50; // 随机模拟 50-250ms
    metrics.api_error_rate = (Math.random() * 1).toFixed(2); // 随机模拟 0-1% 错误率
    metrics.api_request_count = Math.floor(Math.random() * 1000) + 100; // 随机模拟请求数
    
  } catch (error) {
    log(`收集API指标失败: ${error.message}`, 'error');
  }
  
  return metrics;
}

// 收集数据库指标（模拟）
function collectDatabaseMetrics() {
  const metrics = {};
  
  try {
    // 模拟数据，实际应该从数据库监控接口获取
    metrics.db_query_time = Math.floor(Math.random() * 50) + 10; // 随机模拟 10-60ms
    metrics.db_connections = Math.floor(Math.random() * 20) + 5; // 随机模拟 5-25 连接
    
  } catch (error) {
    log(`收集数据库指标失败: ${error.message}`, 'error');
  }
  
  return metrics;
}

// 收集所有指标
async function collectAllMetrics() {
  log('开始收集指标...');
  
  const allMetrics = {};
  
  // 收集服务器指标
  const serverMetrics = collectServerMetrics();
  Object.assign(allMetrics, serverMetrics);
  
  // 收集API指标
  const apiMetrics = collectApiMetrics();
  Object.assign(allMetrics, apiMetrics);
  
  // 收集数据库指标
  const dbMetrics = collectDatabaseMetrics();
  Object.assign(allMetrics, dbMetrics);
  
  // 记录时间戳
  allMetrics.timestamp = new Date().toISOString();
  
  // 保存到历史记录
  saveMetricsToHistory(allMetrics);
  
  log('指标收集完成');
  return allMetrics;
}

// 保存指标到历史记录
function saveMetricsToHistory(metrics) {
  const timestamp = metrics.timestamp || new Date().toISOString();
  
  // 按指标名称组织历史数据
  Object.entries(metrics).forEach(([metricName, value]) => {
    if (!metricsHistory[metricName]) {
      metricsHistory[metricName] = [];
    }
    
    metricsHistory[metricName].push({
      timestamp,
      value
    });
    
    // 保留最近的数据点（例如最近1000个）
    if (metricsHistory[metricName].length > 1000) {
      metricsHistory[metricName].shift();
    }
  });
}

// 检查告警规则
function checkAlertRules(metrics) {
  log('检查告警规则...');
  
  const triggeredAlerts = [];
  
  monitoringConfig.alerts.rules.forEach(rule => {
    // 跳过服务健康检查规则，单独处理
    if (rule.type === 'service_health') {
      return;
    }
    
    const metric = metrics[rule.metric];
    if (metric === undefined) {
      log(`跳过告警规则 ${rule.name}: 未找到指标 ${rule.metric}`, 'debug');
      return;
    }
    
    // 获取阈值
    let threshold;
    if (typeof rule.threshold === 'string' && rule.threshold === 'warningThreshold') {
      const metricConfig = monitoringConfig.metrics.find(m => m.name === rule.metric);
      threshold = metricConfig ? metricConfig.warningThreshold : undefined;
    } else if (typeof rule.threshold === 'string' && rule.threshold === 'criticalThreshold') {
      const metricConfig = monitoringConfig.metrics.find(m => m.name === rule.metric);
      threshold = metricConfig ? metricConfig.criticalThreshold : undefined;
    } else {
      threshold = rule.threshold;
    }
    
    if (threshold === undefined || threshold === null) {
      log(`跳过告警规则 ${rule.name}: 未定义阈值`, 'debug');
      return;
    }
    
    // 检查是否触发告警
    let isTriggered = false;
    switch (rule.comparison) {
      case '>':
        isTriggered = metric > threshold;
        break;
      case '>=':
        isTriggered = metric >= threshold;
        break;
      case '<':
        isTriggered = metric < threshold;
        break;
      case '<=':
        isTriggered = metric <= threshold;
        break;
      case '==':
        isTriggered = metric == threshold;
        break;
      case '!=':
        isTriggered = metric != threshold;
        break;
      default:
        log(`未知的比较运算符: ${rule.comparison}`, 'error');
        return;
    }
    
    if (isTriggered) {
      const alertMessage = rule.message.replace('{{value}}', metric);
      const alert = {
        id: `${rule.id}_${Date.now()}`,
        ruleId: rule.id,
        name: rule.name,
        severity: rule.severity,
        message: alertMessage,
        timestamp: new Date().toISOString(),
        metric: rule.metric,
        value: metric,
        threshold: threshold,
        status: 'triggered',
      };
      
      triggeredAlerts.push(alert);
      alerts.push(alert);
      
      log(`${rule.severity}: ${alertMessage}`, rule.severity.toLowerCase());
      
      // 发送通知
      sendAlertNotifications(alert, rule.notificationChannels);
    }
  });
  
  return triggeredAlerts;
}

// 检查服务健康状态
async function checkServiceHealth() {
  log('检查服务健康状态...');
  
  const healthChecks = [
    {
      service: 'backend',
      url: `${monitoringConfig.backend.serviceUrl}${monitoringConfig.backend.healthCheckEndpoint}`,
    }
  ];
  
  const healthResults = [];
  
  for (const check of healthChecks) {
    try {
      const response = await axios.get(check.url, {
        timeout: 5000
      });
      
      healthResults.push({
        service: check.service,
        status: 'up',
        responseTime: response.headers['x-response-time'] || null,
        timestamp: new Date().toISOString(),
      });
      
      log(`${check.service} 服务健康状态: 正常`, 'info');
      
      // 检查是否有需要恢复的告警
      checkForResolvedAlerts(check.service, 'up');
      
    } catch (error) {
      healthResults.push({
        service: check.service,
        status: 'down',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      
      log(`${check.service} 服务健康状态: 异常 - ${error.message}`, 'error');
      
      // 触发服务不可用告警
      const rule = monitoringConfig.alerts.rules.find(r => 
        r.type === 'service_health' && r.service === check.service
      );
      
      if (rule) {
        const alert = {
          id: `${rule.id}_${Date.now()}`,
          ruleId: rule.id,
          name: rule.name,
          severity: rule.severity,
          message: rule.message,
          timestamp: new Date().toISOString(),
          service: check.service,
          status: 'triggered',
        };
        
        alerts.push(alert);
        sendAlertNotifications(alert, rule.notificationChannels);
      }
    }
  }
  
  return healthResults;
}

// 检查已解决的告警
function checkForResolvedAlerts(service, status) {
  const resolvedAlerts = [];
  
  alerts.forEach(alert => {
    if (alert.status === 'triggered' && alert.service === service) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();
      resolvedAlerts.push(alert);
      
      // 查找对应的恢复消息
      const rule = monitoringConfig.alerts.rules.find(r => r.id === alert.ruleId);
      if (rule && rule.recoveryMessage) {
        const recoveryMessage = rule.recoveryMessage.replace('{{value}}', '正常');
        log(`恢复: ${recoveryMessage}`, 'info');
        
        // 发送恢复通知
        const recoveryAlert = {
          ...alert,
          message: recoveryMessage,
          severity: 'INFO',
        };
        sendAlertNotifications(recoveryAlert, rule.notificationChannels);
      }
    }
  });
  
  return resolvedAlerts;
}

// 发送告警通知
function sendAlertNotifications(alert, channels) {
  if (!channels || channels.length === 0) return;
  
  channels.forEach(channel => {
    switch (channel) {
      case 'email':
        sendEmailNotification(alert);
        break;
      case 'sms':
        sendSmsNotification(alert);
        break;
      case 'webhook':
        sendWebhookNotification(alert);
        break;
      default:
        log(`未知的通知渠道: ${channel}`, 'error');
    }
  });
}

// 发送邮件通知
function sendEmailNotification(alert) {
  if (!monitoringConfig.alerts.notifications.email.enabled) {
    log('邮件通知已禁用', 'debug');
    return;
  }
  
  try {
    const emailConfig = monitoringConfig.alerts.notifications.email;
    
    // 创建邮件传输器
    const transporter = nodemailer.createTransport({
      host: emailConfig.smtp.host,
      port: emailConfig.smtp.port,
      secure: emailConfig.smtp.secure,
      auth: emailConfig.smtp.auth,
    });
    
    // 邮件内容
    const mailOptions = {
      from: emailConfig.from,
      to: emailConfig.recipients.join(','),
      subject: `${emailConfig.subjectPrefix} ${alert.name}`,
      text: `告警信息:\n\n名称: ${alert.name}\n级别: ${alert.severity}\n消息: ${alert.message}\n时间: ${alert.timestamp}`,
      html: `<h2>${emailConfig.subjectPrefix} ${alert.name}</h2>\n<p><strong>级别:</strong> ${alert.severity}</p>\n<p><strong>消息:</strong> ${alert.message}</p>\n<p><strong>时间:</strong> ${alert.timestamp}</p>`,
    };
    
    // 发送邮件
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        log(`发送邮件失败: ${error.message}`, 'error');
      } else {
        log(`邮件通知已发送: ${info.messageId}`, 'info');
      }
    });
    
  } catch (error) {
    log(`配置邮件通知失败: ${error.message}`, 'error');
  }
}

// 发送短信通知
function sendSmsNotification(alert) {
  if (!monitoringConfig.alerts.notifications.sms.enabled) {
    log('短信通知已禁用', 'debug');
    return;
  }
  
  try {
    const smsConfig = monitoringConfig.alerts.notifications.sms;
    
    // 这里应该集成实际的短信服务提供商API
    // 例如Twilio, AWS SNS等
    
    log(`短信通知已触发，但需要实现实际的短信发送逻辑`, 'info');
    
  } catch (error) {
    log(`发送短信失败: ${error.message}`, 'error');
  }
}

// 发送Webhook通知
function sendWebhookNotification(alert) {
  if (!monitoringConfig.alerts.notifications.webhook.enabled) {
    log('Webhook通知已禁用', 'debug');
    return;
  }
  
  try {
    const webhookConfig = monitoringConfig.alerts.notifications.webhook;
    
    // 为每个URL发送webhook
    webhookConfig.urls.forEach(url => {
      axios.post(url, alert, {
        headers: webhookConfig.headers,
        timeout: 5000,
      })
      .then(() => {
        log(`Webhook通知已发送到 ${url}`, 'info');
      })
      .catch(error => {
        log(`发送Webhook失败到 ${url}: ${error.message}`, 'error');
      });
    });
    
  } catch (error) {
    log(`发送Webhook通知失败: ${error.message}`, 'error');
  }
}

// 启动监控服务
function startMonitoring() {
  if (isMonitoringActive) {
    log('监控服务已经在运行', 'warn');
    return;
  }
  
  log('启动监控服务...');
  isMonitoringActive = true;
  
  // 立即执行一次监控
  runMonitoringCycle();
  
  // 设置定时任务
  const interval = monitoringConfig.monitoringService.customMonitoring.collectionInterval;
  const job = schedule.scheduleJob(`*/${interval/1000} * * * * *`, () => {
    runMonitoringCycle();
  });
  
  log(`监控服务已启动，每 ${interval/1000} 秒执行一次监控`, 'info');
  return job;
}

// 停止监控服务
function stopMonitoring(job) {
  if (!isMonitoringActive) {
    log('监控服务未运行', 'warn');
    return;
  }
  
  log('停止监控服务...');
  
  if (job) {
    job.cancel();
  }
  
  isMonitoringActive = false;
  log('监控服务已停止', 'info');
}

// 运行监控周期
async function runMonitoringCycle() {
  if (!isMonitoringActive) return;
  
  try {
    // 收集指标
    const metrics = await collectAllMetrics();
    
    // 检查告警规则
    checkAlertRules(metrics);
    
    // 检查服务健康
    await checkServiceHealth();
    
  } catch (error) {
    log(`监控周期执行失败: ${error.message}`, 'error');
  }
}

// 获取当前监控状态
function getMonitoringStatus() {
  return {
    isActive: isMonitoringActive,
    metrics: metricsHistory,
    alerts: alerts,
    lastRun: metricsHistory.timestamp ? metricsHistory.timestamp[metricsHistory.timestamp.length - 1] : null,
  };
}

// 清理过期告警
function cleanupOldAlerts(days = 7) {
  log('清理过期告警...');
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const initialCount = alerts.length;
  const filteredAlerts = alerts.filter(alert => {
    return new Date(alert.timestamp) > cutoffDate;
  });
  
  alerts.length = 0;
  alerts.push(...filteredAlerts);
  
  log(`已清理 ${initialCount - filteredAlerts.length} 个过期告警`, 'info');
}

// 导出函数
module.exports = {
  startMonitoring,
  stopMonitoring,
  getMonitoringStatus,
  cleanupOldAlerts,
  collectAllMetrics,
  checkServiceHealth,
};

// 直接运行时启动监控
if (require.main === module) {
  const job = startMonitoring();
  
  // 优雅退出
  process.on('SIGINT', () => {
    stopMonitoring(job);
    process.exit(0);
  });
}