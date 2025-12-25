#!/usr/bin/env node

/**
 * 电商系统性能监控脚本
 * 用途: 监控系统关键性能指标，确保系统稳定运行
 * 作者: 开发团队
 * 日期: 2024-06-26
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
require('dotenv').config();

// 监控配置
const MONITORING_CONFIG = {
  // 监控间隔(毫秒)
  interval: 60000, // 1分钟
  
  // 性能指标阈值
  thresholds: {
    cpu: 80, // CPU使用率阈值(%)
    memory: 85, // 内存使用率阈值(%)
    disk: 90, // 磁盘使用率阈值(%)
    apiResponseTime: 1000, // API响应时间阈值(毫秒)
    dbConnectionTime: 500 // 数据库连接时间阈值(毫秒)
  },
  
  // 监控API端点
  apiEndpoints: [
    { name: '健康检查', url: '/api/health' },
    { name: '产品列表', url: '/api/products?page=1&limit=10' },
    { name: '用户认证', url: '/api/auth/check' },
    { name: '订单状态', url: '/api/orders/status' }
  ],
  
  // 日志配置
  logging: {
    enabled: true,
    logDir: path.join(__dirname, 'logs'),
    logFile: 'performance_monitoring.log',
    alertFile: 'alerts.log'
  },
  
  // 告警配置
  alerts: {
    enabled: true,
    email: {
      enabled: false,
      recipients: ['admin@shop.com', 'dev@shop.com']
    },
    sms: {
      enabled: false,
      recipients: ['13800138000']
    },
    webhook: {
      enabled: false,
      url: 'https://notification.shop.com/webhook'
    }
  },
  
  // 数据库配置
  database: {
    connectionString: process.env.MONGO_URI || 'mongodb://localhost:27017/shopdb',
    monitoringEnabled: true
  },
  
  // 服务器API配置
  server: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
    timeout: 5000 // API请求超时时间(毫秒)
  }
};

// 确保日志目录存在
if (MONITORING_CONFIG.logging.enabled) {
  if (!fs.existsSync(MONITORING_CONFIG.logging.logDir)) {
    fs.mkdirSync(MONITORING_CONFIG.logging.logDir, { recursive: true });
  }
}

/**
 * 记录日志
 * @param {string} message - 日志消息
 * @param {string} type - 日志类型 (info, error, warning, alert)
 */
function log(message, type = 'info') {
  if (!MONITORING_CONFIG.logging.enabled) return;
  
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
  const logFilePath = path.join(MONITORING_CONFIG.logging.logDir, MONITORING_CONFIG.logging.logFile);
  
  console.log(`[${type.toUpperCase()}] ${message}`);
  fs.appendFileSync(logFilePath, logMessage);
  
  // 如果是告警，同时写入告警日志
  if (type === 'alert') {
    const alertFilePath = path.join(MONITORING_CONFIG.logging.logDir, MONITORING_CONFIG.logging.alertFile);
    fs.appendFileSync(alertFilePath, logMessage);
  }
}

/**
 * 发送告警通知
 * @param {string} title - 告警标题
 * @param {string} message - 告警消息
 * @param {object} metrics - 相关指标数据
 */
async function sendAlert(title, message, metrics) {
  if (!MONITORING_CONFIG.alerts.enabled) return;
  
  log(`${title}: ${message}`, 'alert');
  
  // 发送邮件告警
  if (MONITORING_CONFIG.alerts.email.enabled) {
    try {
      // 这里实现邮件发送逻辑
      log(`告警邮件已发送至: ${MONITORING_CONFIG.alerts.email.recipients.join(', ')}`, 'info');
    } catch (error) {
      log(`发送邮件告警失败: ${error.message}`, 'error');
    }
  }
  
  // 发送短信告警
  if (MONITORING_CONFIG.alerts.sms.enabled) {
    try {
      // 这里实现短信发送逻辑
      log(`告警短信已发送至: ${MONITORING_CONFIG.alerts.sms.recipients.join(', ')}`, 'info');
    } catch (error) {
      log(`发送短信告警失败: ${error.message}`, 'error');
    }
  }
  
  // 发送Webhook通知
  if (MONITORING_CONFIG.alerts.webhook.enabled) {
    try {
      const payload = {
        title,
        message,
        timestamp: new Date().toISOString(),
        metrics
      };
      
      // 这里实现Webhook调用逻辑
      log(`Webhook告警已发送至: ${MONITORING_CONFIG.alerts.webhook.url}`, 'info');
    } catch (error) {
      log(`发送Webhook告警失败: ${error.message}`, 'error');
    }
  }
}

/**
 * 检查性能指标是否超过阈值
 * @param {object} metrics - 性能指标
 */
function checkThresholds(metrics) {
  const alerts = [];
  
  // 检查CPU使用率
  if (metrics.system && metrics.system.cpu > MONITORING_CONFIG.thresholds.cpu) {
    alerts.push({
      title: 'CPU使用率过高',
      message: `CPU使用率达到 ${metrics.system.cpu}%, 超过阈值 ${MONITORING_CONFIG.thresholds.cpu}%`,
      metrics: { cpu: metrics.system.cpu }
    });
  }
  
  // 检查内存使用率
  if (metrics.system && metrics.system.memory > MONITORING_CONFIG.thresholds.memory) {
    alerts.push({
      title: '内存使用率过高',
      message: `内存使用率达到 ${metrics.system.memory}%, 超过阈值 ${MONITORING_CONFIG.thresholds.memory}%`,
      metrics: { memory: metrics.system.memory }
    });
  }
  
  // 检查磁盘使用率
  if (metrics.system && metrics.system.disk > MONITORING_CONFIG.thresholds.disk) {
    alerts.push({
      title: '磁盘使用率过高',
      message: `磁盘使用率达到 ${metrics.system.disk}%, 超过阈值 ${MONITORING_CONFIG.thresholds.disk}%`,
      metrics: { disk: metrics.system.disk }
    });
  }
  
  // 检查API响应时间
  if (metrics.apiEndpoints) {
    metrics.apiEndpoints.forEach(endpoint => {
      if (endpoint.responseTime > MONITORING_CONFIG.thresholds.apiResponseTime) {
        alerts.push({
          title: `API响应时间过长: ${endpoint.name}`,
          message: `${endpoint.name} 响应时间达到 ${endpoint.responseTime}ms, 超过阈值 ${MONITORING_CONFIG.thresholds.apiResponseTime}ms`,
          metrics: { endpoint: endpoint.name, responseTime: endpoint.responseTime }
        });
      }
      
      if (endpoint.statusCode >= 500) {
        alerts.push({
          title: `API请求失败: ${endpoint.name}`,
          message: `${endpoint.name} 返回错误状态码: ${endpoint.statusCode}`,
          metrics: { endpoint: endpoint.name, statusCode: endpoint.statusCode }
        });
      }
    });
  }
  
  // 检查数据库连接时间
  if (metrics.database && metrics.database.connectionTime > MONITORING_CONFIG.thresholds.dbConnectionTime) {
    alerts.push({
      title: '数据库连接时间过长',
      message: `数据库连接时间达到 ${metrics.database.connectionTime}ms, 超过阈值 ${MONITORING_CONFIG.thresholds.dbConnectionTime}ms`,
      metrics: { dbConnectionTime: metrics.database.connectionTime }
    });
  }
  
  // 检查数据库连接状态
  if (metrics.database && !metrics.database.connected) {
    alerts.push({
      title: '数据库连接失败',
      message: '无法连接到数据库',
      metrics: { dbConnected: false }
    });
  }
  
  return alerts;
}

/**
 * 收集系统资源使用情况
 */
function collectSystemMetrics() {
  try {
    // 获取CPU使用率
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      Object.values(cpu.times).forEach(time => {
        totalTick += time;
      });
      totalIdle += cpu.times.idle;
    });
    
    const cpuUsage = 100 - Math.round((totalIdle / totalTick) * 100);
    
    // 获取内存使用率
    const memoryInfo = os.freemem() / os.totalmem() * 100;
    const memoryUsage = Math.round(100 - memoryInfo);
    
    // 获取磁盘使用率
    const diskInfo = fs.statSync('/');
    const diskTotal = diskInfo.blocks * diskInfo.blksize;
    const diskFree = diskInfo.bfree * diskInfo.blksize;
    const diskUsage = Math.round((1 - diskFree / diskTotal) * 100);
    
    // 获取系统负载
    const loadAvg = os.loadavg();
    
    return {
      cpu: cpuUsage,
      memory: memoryUsage,
      disk: diskUsage,
      loadAvg: {
        1: loadAvg[0].toFixed(2),
        5: loadAvg[1].toFixed(2),
        15: loadAvg[2].toFixed(2)
      },
      uptime: os.uptime(),
      host: os.hostname(),
      platform: os.platform(),
      release: os.release()
    };
  } catch (error) {
    log(`收集系统指标失败: ${error.message}`, 'error');
    return null;
  }
}

/**
 * 测试API端点性能
 */
async function testApiEndpoints() {
  const results = [];
  
  for (const endpoint of MONITORING_CONFIG.apiEndpoints) {
    try {
      const startTime = Date.now();
      const response = await makeHttpRequest(
        MONITORING_CONFIG.server.baseUrl + endpoint.url,
        { method: 'GET', timeout: MONITORING_CONFIG.server.timeout }
      );
      const responseTime = Date.now() - startTime;
      
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        responseTime,
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      log(`测试API端点失败 ${endpoint.name}: ${error.message}`, 'error');
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        responseTime: null,
        statusCode: 500,
        statusMessage: 'Request failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return results;
}

/**
 * 检查数据库连接和性能
 */
async function checkDatabase() {
  if (!MONITORING_CONFIG.database.monitoringEnabled) {
    return { monitoringEnabled: false };
  }
  
  try {
    const startTime = Date.now();
    
    // 检查数据库连接
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONITORING_CONFIG.database.connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 5000
      });
    }
    
    const connectionTime = Date.now() - startTime;
    
    // 检查数据库命令执行
    const pingStart = Date.now();
    await mongoose.connection.db.admin().ping();
    const pingTime = Date.now() - pingStart;
    
    // 获取数据库统计信息
    const stats = await mongoose.connection.db.stats();
    
    return {
      connected: true,
      connectionTime,
      pingTime,
      databaseSize: stats.dataSize,
      collections: stats.collections,
      objects: stats.objects,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    log(`数据库检查失败: ${error.message}`, 'error');
    return {
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 执行HTTP请求
 */
function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      resolve(res);
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.setTimeout(options.timeout || 5000);
    req.end();
  });
}

/**
 * 保存监控数据
 * @param {object} metrics - 监控指标
 */
function saveMetrics(metrics) {
  try {
    const dataDir = path.join(MONITORING_CONFIG.logging.logDir, 'metrics');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(dataDir, `metrics-${timestamp}.json`);
    
    fs.writeFileSync(filename, JSON.stringify(metrics, null, 2));
    
    // 保留最近7天的数据
    cleanupOldMetrics(dataDir);
  } catch (error) {
    log(`保存监控数据失败: ${error.message}`, 'error');
  }
}

/**
 * 清理过期的监控数据
 * @param {string} dataDir - 数据目录
 */
function cleanupOldMetrics(dataDir) {
  try {
    const files = fs.readdirSync(dataDir);
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    files.forEach(file => {
      const filePath = path.join(dataDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtimeMs < sevenDaysAgo) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    log(`清理过期监控数据失败: ${error.message}`, 'error');
  }
}

/**
 * 生成性能报告
 * @param {object} metrics - 监控指标
 */
function generateReport(metrics) {
  let report = '\n========== 系统性能监控报告 ==========\n';
  report += `时间: ${new Date().toLocaleString()}\n\n`;
  
  // 系统资源使用情况
  if (metrics.system) {
    report += '【系统资源使用情况】\n';
    report += `CPU使用率: ${metrics.system.cpu}% (阈值: ${MONITORING_CONFIG.thresholds.cpu}%)\n`;
    report += `内存使用率: ${metrics.system.memory}% (阈值: ${MONITORING_CONFIG.thresholds.memory}%)\n`;
    report += `磁盘使用率: ${metrics.system.disk}% (阈值: ${MONITORING_CONFIG.thresholds.disk}%)\n`;
    report += `系统负载: ${metrics.system.loadAvg.1} (1分钟), ${metrics.system.loadAvg.5} (5分钟), ${metrics.system.loadAvg.15} (15分钟)\n`;
    report += `系统运行时间: ${Math.floor(metrics.system.uptime / 3600)}小时${Math.floor((metrics.system.uptime % 3600) / 60)}分钟\n\n`;
  }
  
  // API性能
  if (metrics.apiEndpoints) {
    report += '【API性能】\n';
    metrics.apiEndpoints.forEach(endpoint => {
      const status = endpoint.statusCode < 400 ? '✅' : '❌';
      const responseTime = endpoint.responseTime ? `${endpoint.responseTime}ms` : '超时';
      report += `${status} ${endpoint.name}: ${responseTime} (状态码: ${endpoint.statusCode})\n`;
    });
    report += '\n';
  }
  
  // 数据库性能
  if (metrics.database) {
    report += '【数据库性能】\n';
    if (metrics.database.connected) {
      report += '✅ 数据库连接正常\n';
      report += `连接时间: ${metrics.database.connectionTime}ms\n`;
      report += `Ping时间: ${metrics.database.pingTime}ms\n`;
      report += `数据库大小: ${(metrics.database.databaseSize / 1024 / 1024).toFixed(2)}MB\n`;
      report += `集合数量: ${metrics.database.collections}\n`;
      report += `文档数量: ${metrics.database.objects}\n`;
      report += `索引数量: ${metrics.database.indexes}\n`;
    } else {
      report += '❌ 数据库连接失败\n';
      report += `错误: ${metrics.database.error}\n`;
    }
    report += '\n';
  }
  
  report += '=====================================\n';
  return report;
}

/**
 * 执行一次完整的监控任务
 */
async function runMonitoring() {
  log('开始执行系统性能监控...', 'info');
  
  const metrics = {
    timestamp: new Date().toISOString(),
    system: collectSystemMetrics(),
    apiEndpoints: await testApiEndpoints(),
    database: await checkDatabase()
  };
  
  // 保存监控数据
  saveMetrics(metrics);
  
  // 生成并打印报告
  const report = generateReport(metrics);
  console.log(report);
  log(report, 'info');
  
  // 检查阈值并发送告警
  const alerts = checkThresholds(metrics);
  for (const alert of alerts) {
    await sendAlert(alert.title, alert.message, alert.metrics);
  }
  
  log('系统性能监控完成', 'info');
  
  // 返回监控数据供外部使用
  return metrics;
}

/**
 * 启动监控服务
 */
function startMonitoring() {
  log('启动系统性能监控服务', 'info');
  log(`监控间隔: ${MONITORING_CONFIG.interval / 1000}秒`, 'info');
  log(`告警阈值 - CPU: ${MONITORING_CONFIG.thresholds.cpu}%, 内存: ${MONITORING_CONFIG.thresholds.memory}%, 磁盘: ${MONITORING_CONFIG.thresholds.disk}%`, 'info');
  log(`API响应时间阈值: ${MONITORING_CONFIG.thresholds.apiResponseTime}ms`, 'info');
  
  // 立即执行一次监控
  runMonitoring();
  
  // 设置定时执行
  setInterval(() => {
    runMonitoring();
  }, MONITORING_CONFIG.interval);
}

/**
 * 停止监控服务
 */
function stopMonitoring() {
  log('停止系统性能监控服务', 'info');
  // 清理数据库连接
  if (mongoose.connection.readyState !== 0) {
    mongoose.disconnect();
  }
  process.exit(0);
}

// 处理进程信号
process.on('SIGINT', stopMonitoring);
process.on('SIGTERM', stopMonitoring);

// 如果直接运行脚本，则启动监控服务
if (require.main === module) {
  startMonitoring();
}

// 导出模块供其他程序使用
module.exports = {
  runMonitoring,
  startMonitoring,
  stopMonitoring,
  collectSystemMetrics,
  testApiEndpoints,
  checkDatabase,
  sendAlert
};
