/**
 * 用户反馈控制器
 * 处理用户反馈相关的HTTP请求
 */

const feedbackService = require('../services/feedback_service');
const logger = require('../utils/logger');
const { validateFeedbackInput } = require('../utils/validators');

class FeedbackController {
  /**
   * 创建新的用户反馈
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async createFeedback(req, res) {
    try {
      const { body } = req;
      
      // 验证输入数据
      const validationResult = validateFeedbackInput(body);
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: validationResult.errors
        });
      }
      
      // 添加IP地址信息
      const feedbackData = {
        ...body,
        ipAddress: req.ip
      };
      
      // 保存反馈
      const result = await feedbackService.saveFeedback(feedbackData);
      
      // 检查是否需要发送高优先级通知
      // 如果评分低于3分，发送高优先级通知
      if (body.rating <= 3) {
        feedbackService.sendHighPriorityNotification({
          ...feedbackData,
          _id: result.feedbackId
        });
      }
      
      return res.status(201).json({
        success: true,
        message: '反馈提交成功',
        data: {
          feedbackId: result.feedbackId
        }
      });
      
    } catch (error) {
      logger.error('创建反馈失败', {
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: '提交反馈失败，请稍后重试',
        error: error.message
      });
    }
  }
  
  /**
   * 获取反馈统计信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async getFeedbackStats(req, res) {
    try {
      // 提取查询参数
      const { startDate, endDate, type } = req.query;
      
      // 构建过滤条件
      const filter = {};
      if (startDate) filter.startDate = new Date(startDate);
      if (endDate) filter.endDate = new Date(endDate);
      if (type) filter.type = type;
      
      // 获取统计数据
      const stats = await feedbackService.getFeedbackStats(filter);
      
      return res.status(200).json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('获取反馈统计失败', {
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: '获取统计信息失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取反馈列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async getFeedbacks(req, res) {
    try {
      // 提取分页和过滤参数
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder || 'desc';
      
      // 构建过滤条件
      const filter = {};
      if (req.query.feedbackType) filter.feedbackType = req.query.feedbackType;
      if (req.query.rating) filter.rating = parseInt(req.query.rating);
      if (req.query.status) filter.status = req.query.status;
      
      // 查询反馈列表
      const result = await feedbackService.getFeedbacks({
        page,
        pageSize,
        filter,
        sortBy,
        sortOrder
      });
      
      // 计算总页数
      const totalPages = Math.ceil(result.total / pageSize);
      
      return res.status(200).json({
        success: true,
        data: {
          feedbacks: result.feedbacks,
          pagination: {
            currentPage: page,
            pageSize,
            totalItems: result.total,
            totalPages
          }
        }
      });
      
    } catch (error) {
      logger.error('获取反馈列表失败', {
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: '获取反馈列表失败',
        error: error.message
      });
    }
  }
  
  /**
   * 获取反馈详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async getFeedbackById(req, res) {
    try {
      const { id } = req.params;
      
      const feedback = await feedbackService.getFeedbackById(id);
      
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: '反馈不存在'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: feedback
      });
      
    } catch (error) {
      logger.error('获取反馈详情失败', {
        feedbackId: req.params.id,
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: '获取反馈详情失败',
        error: error.message
      });
    }
  }
  
  /**
   * 更新反馈状态
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async updateFeedbackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, comment } = req.body;
      
      // 验证状态值
      const validStatuses = ['pending', 'processing', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的状态值'
        });
      }
      
      // 更新状态
      const updatedFeedback = await feedbackService.updateFeedbackStatus(
        id,
        status,
        comment
      );
      
      if (!updatedFeedback) {
        return res.status(404).json({
          success: false,
          message: '反馈不存在'
        });
      }
      
      // 如果状态变更为resolved，并且用户希望接收回复，则发送邮件通知
      if (status === 'resolved' && updatedFeedback.receiveReply) {
        feedbackService.sendResolutionEmail(updatedFeedback, comment);
      }
      
      return res.status(200).json({
        success: true,
        message: '反馈状态已更新',
        data: updatedFeedback
      });
      
    } catch (error) {
      logger.error('更新反馈状态失败', {
        feedbackId: req.params.id,
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: '更新反馈状态失败',
        error: error.message
      });
    }
  }
  
  /**
   * 导出反馈数据
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  async exportFeedbacks(req, res) {
    try {
      // 提取查询参数
      const { startDate, endDate, feedbackType } = req.query;
      
      // 构建过滤条件
      const filter = {};
      if (startDate) filter.createdAt = { $gte: new Date(startDate) };
      if (endDate) {
        if (!filter.createdAt) filter.createdAt = {};
        filter.createdAt.$lte = new Date(endDate);
      }
      if (feedbackType) filter.feedbackType = feedbackType;
      
      // 导出CSV
      const csvData = await feedbackService.exportFeedbacksToCSV(filter);
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=feedbacks_${new Date().toISOString().split('T')[0]}.csv`
      );
      
      // 发送CSV数据
      res.send(csvData);
      
    } catch (error) {
      logger.error('导出反馈数据失败', {
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: '导出数据失败',
        error: error.message
      });
    }
  }
}

module.exports = new FeedbackController();
