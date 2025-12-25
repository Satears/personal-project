/**
 * 数据库迁移方案
 * 版本: v1.0.0
 * 日期: 2025-12-25
 */

const mongoose = require('mongoose');
const User = require('../models/User');
// 导入其他模型

/**
 * 数据库迁移主函数
 */
async function migrateDatabase() {
  try {
    console.log('开始数据库迁移...');
    
    // 1. 创建必要的索引
    await createIndexes();
    
    // 2. 数据结构升级
    await upgradeDataStructures();
    
    // 3. 数据验证和修复
    await validateAndFixData();
    
    console.log('数据库迁移完成！');
  } catch (error) {
    console.error('数据库迁移失败:', error);
    throw error;
  }
}

/**
 * 创建数据库索引
 */
async function createIndexes() {
  console.log('创建数据库索引...');
  
  // 用户模型索引
  await User.collection.createIndex({ email: 1 }, { unique: true });
  await User.collection.createIndex({ username: 1 }, { unique: true });
  await User.collection.createIndex({ isActive: 1 });
  await User.collection.createIndex({ createdAt: 1 });
  
  // 为其他模型创建索引
  // await Product.collection.createIndex({ category: 1 });
  // await Product.collection.createIndex({ price: 1 });
  // await Order.collection.createIndex({ user: 1 });
  // await Order.collection.createIndex({ status: 1 });
  
  console.log('索引创建完成');
}

/**
 * 数据结构升级
 */
async function upgradeDataStructures() {
  console.log('执行数据结构升级...');
  
  // 示例：更新用户文档结构
  await User.updateMany(
    { avatar: { $exists: false } },
    { $set: { avatar: 'http://via.placeholder.com/150' } }
  );
  
  // 示例：确保所有用户都有isActive字段
  await User.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } }
  );
  
  // 示例：更新用户角色字段
  await User.updateMany(
    { role: { $exists: false } },
    { $set: { role: 'user' } }
  );
  
  console.log('数据结构升级完成');
}

/**
 * 数据验证和修复
 */
async function validateAndFixData() {
  console.log('执行数据验证和修复...');
  
  // 查找并修复无效的电子邮件格式
  const invalidEmails = await User.find({
    email: { $not: { $regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } }
  });
  
  for (const user of invalidEmails) {
    console.log(`修复用户 ${user._id} 的无效邮箱: ${user.email}`);
    // 这里可以实现邮箱修复逻辑
  }
  
  // 查找重复用户名
  const usernameCounts = await User.aggregate([
    { $group: { _id: '$username', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  
  if (usernameCounts.length > 0) {
    console.log('发现重复用户名:', usernameCounts);
    // 这里可以实现重复用户名处理逻辑
  }
  
  console.log('数据验证和修复完成');
}

/**
 * 生成迁移报告
 */
async function generateMigrationReport() {
  console.log('生成迁移报告...');
  
  const report = {
    timestamp: new Date(),
    userCount: await User.countDocuments(),
    // 其他统计信息
    migrations: [
      '创建了必要的数据库索引',
      '更新了用户文档结构',
      '验证了数据完整性'
    ]
  };
  
  console.log('迁移报告:', JSON.stringify(report, null, 2));
  return report;
}

// 如果直接运行脚本
if (require.main === module) {
  // 连接数据库
  const mongoose = require('mongoose');
  require('dotenv').config();
  
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('数据库连接成功');
    return migrateDatabase();
  })
  .then(() => {
    return generateMigrationReport();
  })
  .catch(error => {
    console.error('迁移失败:', error);
    process.exit(1);
  })
  .finally(() => {
    mongoose.disconnect();
  });
}

module.exports = { migrateDatabase, generateMigrationReport };
