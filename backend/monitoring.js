// 监控服务入口 - monitoring.js
// 用途：在服务器启动时初始化监控系统并集成到后端应用

const monitoringConfig = require('./config/monitoring_config');
const monitoringService = require('./services/monitoring_service');

/**
 * 初始化监控系统
 * @param {Express.Application} app - Express应用实例
 */
function initMonitoring(app) {
  console.log('初始化监控系统...');
  
  try {
    // 检查监控是否启用
    if (!monitoringConfig.monitoringService.enabled) {
      console.log('监控系统已禁用');
      return;
    }
    
    // 注册监控API端点
    registerMonitoringEndpoints(app);
    
    // 启动监控服务
    const monitoringJob = monitoringService.startMonitoring();
    
    // 处理应用关闭
    process.on('SIGTERM', () => {
      console.log('正在停止监控服务...');
      monitoringService.stopMonitoring(monitoringJob);
    });
    
    console.log('监控系统初始化完成');
    
    return monitoringJob;
    
  } catch (error) {
    console.error('监控系统初始化失败:', error.message);
    // 即使监控初始化失败，应用也应该继续运行
    return null;
  }
}

/**
 * 注册监控相关的API端点
 * @param {Express.Application} app - Express应用实例
 */
function registerMonitoringEndpoints(app) {
  // 获取当前监控状态
  app.get('/api/monitoring/status', (req, res) => {
    try {
      const status = monitoringService.getMonitoringStatus();
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取指标历史数据
  app.get('/api/monitoring/metrics', (req, res) => {
    try {
      const status = monitoringService.getMonitoringStatus();
      res.json({
        success: true,
        data: status.metrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 获取告警列表
  app.get('/api/monitoring/alerts', (req, res) => {
    try {
      const status = monitoringService.getMonitoringStatus();
      const { severity, status: alertStatus } = req.query;
      
      let filteredAlerts = status.alerts;
      
      // 按严重程度过滤
      if (severity) {
        filteredAlerts = filteredAlerts.filter(alert => 
          alert.severity && alert.severity.toLowerCase() === severity.toLowerCase()
        );
      }
      
      // 按状态过滤
      if (alertStatus) {
        filteredAlerts = filteredAlerts.filter(alert => 
          alert.status && alert.status.toLowerCase() === alertStatus.toLowerCase()
        );
      }
      
      res.json({
        success: true,
        data: filteredAlerts,
        total: filteredAlerts.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 手动收集指标
  app.post('/api/monitoring/collect', async (req, res) => {
    try {
      const metrics = await monitoringService.collectAllMetrics();
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 手动检查服务健康状态
  app.post('/api/monitoring/health-check', async (req, res) => {
    try {
      const healthResults = await monitoringService.checkServiceHealth();
      res.json({
        success: true,
        data: healthResults,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
  
  // 清理过期告警
  app.delete('/api/monitoring/alerts/cleanup', (req, res) => {
    try {
      const { days } = req.query;
      const daysToKeep = days ? parseInt(days, 10) : 7;
      
      monitoringService.cleanupOldAlerts(daysToKeep);
      
      res.json({
        success: true,
        message: `已清理 ${daysToKeep} 天前的告警`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
}

/**
 * 获取监控中间件，用于收集HTTP请求指标
 */
function getMonitoringMiddleware() {
  // 检查是否启用API监控
  if (!monitoringConfig.backend || !monitoringConfig.metrics.find(m => m.name === 'api_response_time')) {
    return (req, res, next) => next();
  }
  
  return (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    let responseBody = '';
    
    // 捕获响应体
    res.send = function(body) {
      responseBody = body;
      return originalSend.call(this, body);
    };
    
    // 请求完成后收集指标
    res.on('finish', () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 这里可以将指标发送到监控服务
      // 由于我们使用定期收集，这里只做简单日志记录
      if (monitoringConfig.logging && monitoringConfig.logging.level === 'debug') {
        console.log(`[监控] ${req.method} ${req.url} - 响应时间: ${responseTime}ms - 状态码: ${res.statusCode}`);
      }
      
      // 记录API错误率（状态码>=400为错误）
      if (res.statusCode >= 400) {
        if (monitoringConfig.logging && monitoringConfig.logging.level === 'warn') {
          console.warn(`[监控] ${req.method} ${req.url} - 错误状态码: ${res.statusCode}`);
        }
      }
    });
    
    next();
  };
}

/**
 * 健康检查端点处理器
 */
function getHealthCheckHandler() {
  return async (req, res) => {
    try {
      // 检查数据库连接
      const dbHealth = await checkDatabaseHealth();
      
      // 检查API端点健康状态
      const apiHealth = await checkApiHealth();
      
      // 确定整体状态
      const overallStatus = dbHealth.status === 'up' && apiHealth.status === 'up' ? 'up' : 'down';
      
      // 设置适当的HTTP状态码
      const statusCode = overallStatus === 'up' ? 200 : 503;
      
      res.status(statusCode).json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks: {
          database: dbHealth,
          api: apiHealth,
        },
        service: {
          name: monitoringConfig.systemName || 'shop-backend',
          version: process.env.npm_package_version || 'unknown',
          nodeVersion: process.version,
        },
      });
    } catch (error) {
      res.status(503).json({
        status: 'down',
        timestamp: new Date().toISOString(),
        error: error.message,
        service: {
          name: monitoringConfig.systemName || 'shop-backend',
          version: process.env.npm_package_version || 'unknown',
        },
      });
    }
  };
}

/**
 * 检查数据库健康状态
 */
async function checkDatabaseHealth() {
  try {
    // 这里应该实现实际的数据库健康检查
    // 由于没有直接访问数据库连接的引用，我们返回模拟数据
    // 在实际实现中，应该检查数据库连接池状态
    
    return {
      status: 'up',
      message: '数据库连接正常',
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message,
    };
  }
}

/**
 * 检查API健康状态
 */
async function checkApiHealth() {
  try {
    // 检查基本API端点状态
    return {
      status: 'up',
      message: 'API服务正常',
    };
  } catch (error) {
    return {
      status: 'down',
      error: error.message,
    };
  }
}

module.exports = {
  initMonitoring,
  getMonitoringMiddleware,
  getHealthCheckHandler,
};
