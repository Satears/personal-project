#!/usr/bin/env node

/**
 * 数据库备份脚本
 * 使用说明：node database_backup.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 备份目录
const BACKUP_DIR = path.join(__dirname, 'backups');

// 数据库连接信息
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shopdb';
const DB_NAME = MONGO_URI.split('/').pop().split('?')[0];

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 生成备份文件名
const generateBackupFileName = () => {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-');
  return `${DB_NAME}_backup_${dateStr}.gz`;
};

// 执行备份
const backupDatabase = async () => {
  try {
    console.log('开始数据库备份...');
    
    const backupFileName = generateBackupFileName();
    const backupPath = path.join(BACKUP_DIR, backupFileName);
    
    // 使用mongodump命令进行备份
    const command = `mongodump --uri="${MONGO_URI}" --gzip --archive="${backupPath}"`;
    
    console.log(`执行命令: ${command}`);
    
    await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('备份失败:', error);
          reject(error);
          return;
        }
        console.log('备份成功:', stdout);
        resolve();
      });
    });
    
    console.log(`备份文件已保存至: ${backupPath}`);
    
    // 清理旧备份（保留最近7天的备份）
    cleanupOldBackups();
    
    return backupPath;
  } catch (error) {
    console.error('数据库备份过程中发生错误:', error);
    throw error;
  }
};

// 清理旧备份
const cleanupOldBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && stats.mtimeMs < sevenDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`已删除旧备份: ${file}`);
      }
    });
  } catch (error) {
    console.error('清理旧备份失败:', error);
  }
};

// 数据库恢复函数
const restoreDatabase = async (backupFilePath) => {
  try {
    console.log(`开始从备份文件恢复数据库: ${backupFilePath}`);
    
    const command = `mongorestore --uri="${MONGO_URI}" --gzip --archive="${backupFilePath}"`;
    
    console.log(`执行命令: ${command}`);
    
    await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('恢复失败:', error);
          reject(error);
          return;
        }
        console.log('恢复成功:', stdout);
        resolve();
      });
    });
    
    console.log('数据库恢复完成');
  } catch (error) {
    console.error('数据库恢复过程中发生错误:', error);
    throw error;
  }
};

// 如果直接运行脚本
if (require.main === module) {
  backupDatabase().catch(error => {
    console.error('备份失败:', error);
    process.exit(1);
  });
}

module.exports = { backupDatabase, restoreDatabase };
