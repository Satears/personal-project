const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const configureApp = require('./config/app');
const healthController = require('./controllers/healthController');
const { 
  globalErrorHandler, 
  notFoundHandler,
  logger 
} = require('./middlewares/errorHandler');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 配置应用
configureApp(app);

// 连接数据库
connectDB();

// 健康检查路由
app.get('/api/health', healthController.healthCheck);

// 路由注册
app.use('/api/auth', require('./routes/userRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));



// 404 处理
app.use(notFoundHandler);

// 全局错误处理中间件
app.use(globalErrorHandler);

// 获取端口
const PORT = process.env.PORT || 5000;

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;