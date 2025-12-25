const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const configureApp = (app) => {
  // 安全中间件
  app.use(helmet());
  
  // CORS 配置
  app.use(cors({
    origin: process.env.NODE_ENV === 'development' ? '*' : 'https://your-production-domain.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // 请求体解析
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // 日志中间件
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  
  // 健康检查端点
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
  });
  
  return app;
};

module.exports = configureApp;