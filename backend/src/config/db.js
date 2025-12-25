const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // 不再退出进程，而是记录错误并允许应用继续运行
    console.log('应用将在无数据库连接的情况下继续运行，某些功能可能不可用');
  }
};

module.exports = connectDB;