/**
 * 用户反馈服务层
 * 实现用户反馈相关的业务逻辑处理
 */

const Feedback = require('../models/feedback_model');
const emailService = require('./email_service');
const notificationService = require('./notification_service');
const logger = require('../utils/logger');
const config = require('../config/config');

class FeedbackService {
  /**
   * 保存用户反馈
   * @param {Object} feedbackData - 反馈数据
   * @returns {Promise<Object>} 保存结果
   */
  async saveFeedback(feedbackData) {
    try {
      // 构建反馈对象
      const feedback = new Feedback({
        feedbackType: feedbackData.feedbackType,
        selectedIssues: feedbackData.selectedIssues,
        rating: feedbackData.rating,
        description: feedbackData.description,
        contactMethod: feedbackData.contactMethod,
        browserInfo: feedbackData.browserInfo,
        receiveReply: feedbackData.receiveReply || false,
        ipAddress: feedbackData.ipAddress,
        status: 'pending',
        createdAt: new Date(feedbackData.timestamp) || new Date(),
        updatedAt: new Date()
      });
      
      // 保存到数据库
      await feedback.save();
      
      return {
        feedbackId: feedback._id,
        status: 'success'
      };
    } catch (error) {
      logger.error('保存反馈数据失败', {
        error: error.message,
        stack: error.stack
      });
      throw new Error('保存反馈失败');
    }
  }
  
  /**
   * 获取反馈统计信息
   * @param {Object} filter - 过滤条件
   * @returns {Promise<Object>} 统计数据
   */
  async getFeedbackStats(filter = {}) {
    try {
      // 构建查询条件
      const query = {};
      if (filter.startDate) query.createdAt = { $gte: filter.startDate };
      if (filter.endDate) {
        if (!query.createdAt) query.createdAt = {};
        query.createdAt.$lte = filter.endDate;
      }
      
      // 获取总体统计
      const totalFeedbacks = await Feedback.countDocuments(query);
      
      // 按反馈类型统计
      const typeStats = await Feedback.aggregate([
        { $match: query },
        { $group: { _id: '$feedbackType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      // 按评分统计
      const ratingStats = await Feedback.aggregate([
        { $match: query },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      
      // 按状态统计
      const statusStats = await Feedback.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      
      // 计算平均评分
      const avgRatingResult = await Feedback.aggregate([
        { $match: query },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]);
      
      const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating.toFixed(2) : 0;
      
      // 最近一周趋势
      const weeklyTrend = await this.getWeeklyTrend(filter);
      
      return {
        totalFeedbacks,
        averageRating: parseFloat(avgRating),
        typeDistribution: typeStats.map(item => ({
          type: item._id,
          count: item.count,
          percentage: totalFeedbacks ? (item.count / totalFeedbacks * 100).toFixed(1) : 0
        })),
        ratingDistribution: ratingStats,
        statusDistribution: statusStats,
        weeklyTrend
      };
    } catch (error) {
      logger.error('获取反馈统计失败', {
        error: error.message,
        stack: error.stack
      });
      throw new Error('获取统计信息失败');
    }
  }
  
  /**
   * 获取反馈列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 反馈列表和分页信息
   */
  async getFeedbacks(options) {
    try {
      const { page = 1, pageSize = 20, filter = {}, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      
      // 构建查询条件
      const query = { ...filter };
      
      // 计算分页参数
      const skip = (page - 1) * pageSize;
      const limit = pageSize;
      
      // 构建排序参数
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
      
      // 查询反馈列表
      const feedbacks = await Feedback.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      
      // 获取总数
      const total = await Feedback.countDocuments(query);
      
      return {
        feedbacks,
        total
      };
    } catch (error) {
      logger.error('获取反馈列表失败', {
        error: error.message,
        stack: error.stack
      });
      throw new Error('获取反馈列表失败');
    }
  }
  
  /**
   * 根据ID获取反馈详情
   * @param {string} feedbackId - 反馈ID
   * @returns {Promise<Object|null>} 反馈详情
   */
  async getFeedbackById(feedbackId) {
    try {
      const feedback = await Feedback.findById(feedbackId).lean();
      return feedback;
    } catch (error) {
      logger.error('获取反馈详情失败', {
        feedbackId,
        error: error.message,
        stack: error.stack
      });
      throw new Error('获取反馈详情失败');
    }
  }
  
  /**
   * 更新反馈状态
   * @param {string} feedbackId - 反馈ID
   * @param {string} status - 新状态
   * @param {string} comment - 处理备注
   * @returns {Promise<Object|null>} 更新后的反馈
   */
  async updateFeedbackStatus(feedbackId, status, comment = '') {
    try {
      // 更新反馈状态
      const feedback = await Feedback.findByIdAndUpdate(
        feedbackId,
        {
          $set: {
            status,
            updatedAt: new Date()
          },
          $push: {
            comments: {
              status,
              comment,
              timestamp: new Date()
            }
          }
        },
        { new: true }
      );
      
      return feedback;
    } catch (error) {
      logger.error('更新反馈状态失败', {
        feedbackId,
        status,
        error: error.message,
        stack: error.stack
      });
      throw new Error('更新反馈状态失败');
    }
  }
  
  /**
   * 发送高优先级反馈通知
   * @param {Object} feedback - 反馈数据
   */
  async sendHighPriorityNotification(feedback) {
    try {
      // 构建通知内容
      const notificationContent = {
        title: `【高优先级反馈】新的${this.getFeedbackTypeName(feedback.feedbackType)}反馈`,
        message: `用户评分: ${feedback.rating}分\n问题类型: ${feedback.selectedIssues.join(', ')}`,
        details: feedback.description,
        contact: feedback.contactMethod,
        feedbackId: feedback._id,
        priority: feedback.rating <= 2 ? 'high' : 'medium'
      };
      
      // 发送邮件通知给管理员
      if (config.adminEmails && config.adminEmails.length > 0) {
        await emailService.sendAdminNotification({
          to: config.adminEmails,
          subject: notificationContent.title,
          template: 'feedback-high-priority',
          context: notificationContent
        });
      }
      
      // 发送系统内部通知
      await notificationService.sendSystemNotification({
        type: 'feedback-high-priority',
        content: notificationContent
      });
      
      logger.info('高优先级反馈通知已发送', {
        feedbackId: feedback._id,
        feedbackType: feedback.feedbackType,
        rating: feedback.rating
      });
      
    } catch (error) {
      logger.error('发送高优先级反馈通知失败', {
        feedbackId: feedback._id,
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  /**
   * 发送解决通知邮件
   * @param {Object} feedback - 反馈数据
   * @param {string} comment - 处理备注
   */
  async sendResolutionEmail(feedback, comment) {
    try {
      // 构建邮件内容
      const emailContent = {
        subject: '【电商系统】您的反馈已处理',
        template: 'feedback-resolution',
        context: {
          feedbackId: feedback._id,
          feedbackType: this.getFeedbackTypeName(feedback.feedbackType),
          description: feedback.description,
          resolutionComment: comment,
          contact: feedback.contactMethod,
          timestamp: new Date().toLocaleString('zh-CN')
        }
      };
      
      // 发送邮件
      await emailService.sendEmail({
        to: feedback.contactMethod,
        ...emailContent
      });
      
      logger.info('反馈解决通知已发送', {
        feedbackId: feedback._id,
        contact: feedback.contactMethod
      });
      
    } catch (error) {
      logger.error('发送反馈解决通知失败', {
        feedbackId: feedback._id,
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  /**
   * 安排每日汇总
   */
  async scheduleDailySummary() {
    try {
      // 这里可以集成定时任务调度器
      // 例如使用 node-cron 或其他调度库
      // 暂时只记录日志，实际项目中需要配置定时任务
      logger.info('已安排反馈每日汇总');
    } catch (error) {
      logger.error('安排反馈每日汇总失败', {
        error: error.message
      });
    }
  }
  
  /**
   * 获取每周趋势数据
   * @param {Object} filter - 过滤条件
   * @returns {Promise<Array>} 趋势数据
   */
  async getWeeklyTrend(filter) {
    try {
      const endDate = filter.endDate || new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      
      const trendQuery = { createdAt: { $gte: startDate, $lte: endDate } };
      
      // 按天分组统计
      const dailyStats = await Feedback.aggregate([
        { $match: trendQuery },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }},
        { $sort: { _id: 1 } }
      ]);
      
      return dailyStats.map(item => ({
        date: item._id,
        count: item.count,
        averageRating: parseFloat(item.avgRating.toFixed(2))
      }));
    } catch (error) {
      logger.error('获取每周趋势失败', {
        error: error.message
      });
      return [];
    }
  }
  
  /**
   * 获取反馈类型中文名称
   * @param {string} type - 反馈类型
   * @returns {string} 中文名称
   */
  getFeedbackTypeName(type) {
    const typeMap = {
      bug: '功能故障',
      suggestion: '功能建议',
      performance: '性能问题',
      ui: '界面/体验',
      content: '内容错误',
      other: '其他问题'
    };
    return typeMap[type] || type;
  }
  
  /**
   * 导出反馈数据（CSV格式）
   * @param {Object} filter - 过滤条件
   * @returns {Promise<string>} CSV数据
   */
  async exportFeedbacksToCSV(filter = {}) {
    try {
      const feedbacks = await Feedback.find(filter)
        .sort({ createdAt: -1 })
        .lean();
      
      // 构建CSV头部
      const headers = ['反馈ID', '反馈类型', '问题类型', '评分', '描述', '联系方式', '状态', '创建时间', '更新时间'];
      let csvContent = headers.join(',') + '\n';
      
      // 构建CSV内容
      feedbacks.forEach(feedback => {
        const row = [
          feedback._id,
          this.getFeedbackTypeName(feedback.feedbackType),
          feedback.selectedIssues.join(';'),
          feedback.rating,
          '"' + feedback.description.replace(/"/g, '""') + '"',
          feedback.contactMethod,
          feedback.status,
          new Date(feedback.createdAt).toLocaleString('zh-CN'),
          new Date(feedback.updatedAt).toLocaleString('zh-CN')
        ];
        csvContent += row.join(',') + '\n';
      });
      
      return csvContent;
    } catch (error) {
      logger.error('导出反馈数据失败', {
        error: error.message,
        stack: error.stack
      });
      throw new Error('导出数据失败');
    }
  }
}

module.exports = new FeedbackService();
