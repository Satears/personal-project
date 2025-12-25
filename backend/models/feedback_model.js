/**
 * 用户反馈模型
 * 定义用户反馈的数据结构和验证规则
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * 反馈评论子模式
 */
const CommentSchema = new Schema({
  status: {
    type: String,
    enum: ['pending', 'processing', 'resolved', 'closed'],
    required: true
  },
  comment: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
});

/**
 * 用户反馈主模式
 */
const FeedbackSchema = new Schema({
  /**
   * 反馈类型
   */
  feedbackType: {
    type: String,
    enum: ['bug', 'suggestion', 'performance', 'ui', 'content', 'other'],
    required: true,
    trim: true
  },
  
  /**
   * 选择的问题类型（可多选）
   */
  selectedIssues: [{
    type: String,
    trim: true
  }],
  
  /**
   * 评分（1-5分）
   */
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  
  /**
   * 详细描述
   */
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  /**
   * 联系方式（邮箱或手机号）
   */
  contactMethod: {
    type: String,
    trim: true
  },
  
  /**
   * 浏览器信息
   */
  browserInfo: {
    type: Object
  },
  
  /**
   * 是否希望接收回复
   */
  receiveReply: {
    type: Boolean,
    default: false
  },
  
  /**
   * IP地址
   */
  ipAddress: {
    type: String,
    trim: true
  },
  
  /**
   * 状态
   */
  status: {
    type: String,
    enum: ['pending', 'processing', 'resolved', 'closed'],
    default: 'pending',
    required: true
  },
  
  /**
   * 评论历史
   */
  comments: [CommentSchema],
  
  /**
   * 创建时间
   */
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  /**
   * 更新时间
   */
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  /**
   * 配置选项
   */
  timestamps: true,
  collection: 'feedbacks'
});

/**
 * 索引定义
 */
FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ feedbackType: 1 });
FeedbackSchema.index({ rating: 1 });

/**
 * 虚拟属性 - 无
 */

/**
 * 文档方法
 */
FeedbackSchema.methods.toJSON = function() {
  const obj = this.toObject();
  // 移除敏感信息
  delete obj.ipAddress;
  return obj;
};

/**
 * 静态方法
 */
FeedbackSchema.statics.findHighPriorityFeedbacks = function() {
  // 查找评分低于3分的未处理反馈
  return this.find({
    rating: { $lte: 3 },
    status: { $ne: 'closed' }
  })
    .sort({ rating: 1, createdAt: -1 })
    .limit(10);
};

/**
 * 中间件
 */
FeedbackSchema.pre('save', function(next) {
  // 确保更新时间始终更新
  this.updatedAt = new Date();
  next();
});

/**
 * 导出模型
 */
const Feedback = mongoose.model('Feedback', FeedbackSchema);
module.exports = Feedback;
