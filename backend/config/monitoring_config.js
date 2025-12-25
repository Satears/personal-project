// 监控告警配置文件 - monitoring_config.js
// 用途：配置系统关键指标监控和告警规则

const config = {
  // 系统名称
  systemName: '电商系统',
  
  // 监控服务配置
  monitoringService: {
    // 可以选择的监控服务类型
    type: 'custom', // 'prometheus', 'grafana', 'datadog', 'custom'
    
    // 自定义监控服务配置
    customMonitoring: {
      apiUrl: 'http://localhost:5000/api/monitoring',
      collectionInterval: 60000, // 收集间隔(毫秒)
      retentionDays: 30, // 数据保留天数
    },
    
    // Prometheus配置（如果使用）
    prometheus: {
      endpoint: 'http://localhost:9090',
      scrapeInterval: '15s',
    },
    
    // Grafana配置（如果使用）
    grafana: {
      url: 'http://localhost:3000',
      apiKey: 'YOUR_GRAFANA_API_KEY',
    },
  },
  
  // 后端服务监控配置
  backend: {
    serviceUrl: 'http://localhost:5000',
    healthCheckEndpoint: '/api/health',
    responseTimeThreshold: 500, // 响应时间阈值(毫秒)
    maxErrorRate: 0.05, // 最大错误率(0.05 = 5%)
  },
  
  // 数据库监控配置
  database: {
    type: 'mongodb',
    connectionString: process.env.MONGO_URI || 'mongodb://localhost:27017/shopdb',
    queryTimeThreshold: 100, // 查询时间阈值(毫秒)
    maxConnectionPool: 50, // 最大连接池大小
    slowQueryThreshold: 200, // 慢查询阈值(毫秒)
  },
  
  // 前端监控配置
  frontend: {
    serviceUrl: 'http://localhost',
    pageLoadTimeThreshold: 3000, // 页面加载时间阈值(毫秒)
    apiCallErrorRate: 0.03, // API调用错误率阈值
  },
  
  // 关键指标配置
  metrics: [
    // 服务器指标
    {
      name: 'server_cpu_usage',
      description: '服务器CPU使用率',
      type: 'percentage',
      warningThreshold: 70,
      criticalThreshold: 90,
      collectionMethod: 'system',
    },
    {
      name: 'server_memory_usage',
      description: '服务器内存使用率',
      type: 'percentage',
      warningThreshold: 75,
      criticalThreshold: 95,
      collectionMethod: 'system',
    },
    {
      name: 'server_disk_space',
      description: '服务器磁盘空间使用率',
      type: 'percentage',
      warningThreshold: 80,
      criticalThreshold: 90,
      collectionMethod: 'system',
    },
    
    // API指标
    {
      name: 'api_response_time',
      description: 'API平均响应时间',
      type: 'milliseconds',
      warningThreshold: 300,
      criticalThreshold: 500,
      collectionMethod: 'application',
    },
    {
      name: 'api_error_rate',
      description: 'API错误率',
      type: 'percentage',
      warningThreshold: 2,
      criticalThreshold: 5,
      collectionMethod: 'application',
    },
    {
      name: 'api_request_count',
      description: 'API请求次数',
      type: 'count',
      warningThreshold: null, // 可以根据业务需求设置
      criticalThreshold: null,
      collectionMethod: 'application',
    },
    
    // 数据库指标
    {
      name: 'db_query_time',
      description: '数据库查询平均时间',
      type: 'milliseconds',
      warningThreshold: 50,
      criticalThreshold: 100,
      collectionMethod: 'application',
    },
    {
      name: 'db_connections',
      description: '数据库活跃连接数',
      type: 'count',
      warningThreshold: 25, // 最大连接池的50%
      criticalThreshold: 40, // 最大连接池的80%
      collectionMethod: 'application',
    },
    
    // 前端指标
    {
      name: 'frontend_page_load_time',
      description: '前端页面加载时间',
      type: 'milliseconds',
      warningThreshold: 2000,
      criticalThreshold: 3000,
      collectionMethod: 'frontend',
    },
    {
      name: 'frontend_error_count',
      description: '前端错误数量',
      type: 'count',
      warningThreshold: 10,
      criticalThreshold: 50,
      collectionMethod: 'frontend',
    },
  ],
  
  // 告警配置
  alerts: {
    // 告警级别
    levels: {
      INFO: {
        name: '信息',
        color: 'blue',
        description: '提供系统状态信息，无需立即处理',
      },
      WARNING: {
        name: '警告',
        color: 'yellow',
        description: '需要注意的异常情况，建议尽快检查',
      },
      ERROR: {
        name: '错误',
        color: 'red',
        description: '严重的错误情况，需要立即处理',
      },
    },
    
    // 告警规则
    rules: [
      {
        id: 'high_cpu_usage',
        name: '高CPU使用率',
        metric: 'server_cpu_usage',
        comparison: '>=',
        threshold: 'criticalThreshold',
        message: '服务器CPU使用率过高: {{value}}%',
        severity: 'ERROR',
        notificationChannels: ['email', 'sms'],
        recoveryMessage: '服务器CPU使用率已恢复正常: {{value}}%',
      },
      {
        id: 'high_memory_usage',
        name: '高内存使用率',
        metric: 'server_memory_usage',
        comparison: '>=',
        threshold: 'criticalThreshold',
        message: '服务器内存使用率过高: {{value}}%',
        severity: 'ERROR',
        notificationChannels: ['email', 'sms'],
        recoveryMessage: '服务器内存使用率已恢复正常: {{value}}%',
      },
      {
        id: 'slow_api_response',
        name: 'API响应缓慢',
        metric: 'api_response_time',
        comparison: '>=',
        threshold: 'warningThreshold',
        message: 'API响应时间过长: {{value}}ms',
        severity: 'WARNING',
        notificationChannels: ['email'],
        recoveryMessage: 'API响应时间已恢复正常: {{value}}ms',
      },
      {
        id: 'high_api_error_rate',
        name: 'API错误率过高',
        metric: 'api_error_rate',
        comparison: '>=',
        threshold: 'warningThreshold',
        message: 'API错误率过高: {{value}}%',
        severity: 'WARNING',
        notificationChannels: ['email'],
        recoveryMessage: 'API错误率已恢复正常: {{value}}%',
      },
      {
        id: 'backend_service_down',
        name: '后端服务不可用',
        metric: null,
        type: 'service_health',
        service: 'backend',
        message: '后端服务不可用，请立即检查',
        severity: 'ERROR',
        notificationChannels: ['email', 'sms', 'webhook'],
        recoveryMessage: '后端服务已恢复正常',
      },
      {
        id: 'frontend_page_load_slow',
        name: '前端页面加载缓慢',
        metric: 'frontend_page_load_time',
        comparison: '>=',
        threshold: 'warningThreshold',
        message: '前端页面加载时间过长: {{value}}ms',
        severity: 'WARNING',
        notificationChannels: ['email'],
        recoveryMessage: '前端页面加载时间已恢复正常: {{value}}ms',
      },
    ],
    
    // 告警通知配置
    notifications: {
      email: {
        enabled: true,
        recipients: ['admin@example.com', 'devops@example.com'],
        smtp: {
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          auth: {
            user: 'alert@example.com',
            pass: process.env.SMTP_PASSWORD || 'your_password',
          },
        },
        from: '监控系统 <alert@example.com>',
        subjectPrefix: '[监控告警]',
      },
      
      sms: {
        enabled: false, // 默认禁用短信
        provider: 'twilio',
        numbers: ['+8613800138000'],
        twilio: {
          accountSid: process.env.TWILIO_SID || 'your_account_sid',
          authToken: process.env.TWILIO_AUTH_TOKEN || 'your_auth_token',
          fromNumber: '+1234567890',
        },
      },
      
      webhook: {
        enabled: true,
        urls: ['http://localhost:3000/webhook/alert'],
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.WEBHOOK_API_KEY || 'your_webhook_key',
        },
      },
      
      // 其他通知方式可以根据需要添加，如Slack, Telegram等
    },
    
    // 告警静默配置
    silence: {
      enabled: false,
      duration: 3600000, // 静默时间(毫秒)
      reason: '',
      creator: '',
    },
  },
  
  // 日志配置
  logging: {
    level: 'info', // 'debug', 'info', 'warn', 'error'
    file: {
      enabled: true,
      path: './logs/monitoring.log',
      maxSize: '10m',
      maxFiles: '7d',
    },
    console: {
      enabled: true,
      colorize: true,
    },
    sentry: {
      enabled: false,
      dsn: process.env.SENTRY_DSN || '',
    },
  },
};

module.exports = config;
