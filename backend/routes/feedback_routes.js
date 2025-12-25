/**
 * 用户反馈API接口
 * 用于接收和处理用户提交的系统反馈数据
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi'); // 用于数据验证
const feedbackService = require('../services/feedback_service');
const logger = require('../utils/logger');
const authMiddleware = require('../middleware/auth');

// 反馈数据验证模式
const feedbackSchema = Joi.object({
  feedbackType: Joi.string().required().valid('bug', 'suggestion', 'performance', 'ui', 'content', 'other'),
  selectedIssues: Joi.array().items(Joi.string()).min(1).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  description: Joi.string().required().min(10).max(2000),
  contactMethod: Joi.string().required().custom((value, helpers) => {
    // 验证邮箱或手机号
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^1[3-9]\d{9}$/;
    
    if (emailRegex.test(value) || phoneRegex.test(value)) {
      return value;
    }
    return helpers.error('any.invalid', {
      message: '请输入有效的邮箱或手机号码'
    });
  }),
  browserInfo: Joi.string().optional(),
  receiveReply: Joi.boolean().optional().default(false),
  timestamp: Joi.string().optional()
});

/**
 * @route POST /api/feedback/submit
 * @description 提交用户反馈
 * @access 公共（无需认证）
 */
router.post('/submit', async (req, res) => {
  try {
    // 验证请求数据
    const { error, value } = feedbackSchema.validate(req.body, {
      abortEarly: false
    });
    
    if (error) {
      // 收集所有验证错误
      const validationErrors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: validationErrors
      });
    }
    
    // 添加时间戳（如果不存在）
    if (!value.timestamp) {
      value.timestamp = new Date().toISOString();
    }
    
    // 添加IP地址信息（用于分析）
    value.ipAddress = req.ip || req.connection.remoteAddress;
    
    // 处理用户反馈
    const result = await feedbackService.saveFeedback(value);
    
    // 记录日志
    logger.info('用户反馈已提交', {
      feedbackId: result.feedbackId,
      feedbackType: value.feedbackType,
      rating: value.rating
    });
    
    // 返回成功响应
    res.status(201).json({
      success: true,
      message: '感谢您的反馈！我们将认真分析您的建议。',
      feedbackId: result.feedbackId
    });
    
    // 异步处理反馈通知（不阻塞响应）
    processFeedbackNotification(value);
    
  } catch (error) {
    // 记录错误日志
    logger.error('处理用户反馈时出错', {
      error: error.message,
      stack: error.stack
    });
    
    // 返回错误响应
    res.status(500).json({
      success: false,
      message: '提交反馈时出现错误，请稍后再试',
      error: error.message
    });
  }
});

/**
 * @route GET /api/feedback/stats
 * @description 获取反馈统计信息（管理员功能）
 * @access 需要认证，管理员权限
 */
router.get('/stats', authMiddleware.authenticate, authMiddleware.checkAdmin, async (req, res) => {
  try {
    // 获取统计参数
    const { startDate, endDate } = req.query;
    
    // 验证日期参数
    let dateFilter = {};
    if (startDate) dateFilter.startDate = new Date(startDate);
    if (endDate) dateFilter.endDate = new Date(endDate);
    
    // 获取统计数据
    const stats = await feedbackService.getFeedbackStats(dateFilter);
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    logger.error('获取反馈统计时出错', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
});

/**
 * @route GET /api/feedback/list
 * @description 获取反馈列表（管理员功能）
 * @access 需要认证，管理员权限
 */
router.get('/list', authMiddleware.authenticate, authMiddleware.checkAdmin, async (req, res) => {
  try {
    // 获取查询参数
    const { page = 1, pageSize = 20, feedbackType, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // 构建查询条件
    const filter = {};
    if (feedbackType) filter.feedbackType = feedbackType;
    if (status) filter.status = status;
    
    // 获取反馈列表
    const result = await feedbackService.getFeedbacks({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      filter,
      sortBy,
      sortOrder
    });
    
    res.status(200).json({
      success: true,
      data: result.feedbacks,
      pagination: {
        total: result.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(result.total / parseInt(pageSize))
      }
    });
    
  } catch (error) {
    logger.error('获取反馈列表时出错', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: '获取反馈列表失败',
      error: error.message
    });
  }
});

/**
 * @route GET /api/feedback/:id
 * @description 获取单个反馈详情（管理员功能）
 * @access 需要认证，管理员权限
 */
router.get('/:id', authMiddleware.authenticate, authMiddleware.checkAdmin, async (req, res) => {
  try {
    const feedbackId = req.params.id;
    
    // 获取反馈详情
    const feedback = await feedbackService.getFeedbackById(feedbackId);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: '反馈不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: feedback
    });
    
  } catch (error) {
    logger.error('获取反馈详情时出错', {
      feedbackId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: '获取反馈详情失败',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/feedback/:id/status
 * @description 更新反馈状态（管理员功能）
 * @access 需要认证，管理员权限
 */
router.put('/:id/status', authMiddleware.authenticate, authMiddleware.checkAdmin, async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const { status, comment } = req.body;
    
    // 验证状态参数
    const statusSchema = Joi.object({
      status: Joi.string().required().valid('pending', 'processing', 'resolved', 'closed'),
      comment: Joi.string().optional().max(1000)
    });
    
    const { error } = statusSchema.validate({ status, comment });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    
    // 更新状态
    const updated = await feedbackService.updateFeedbackStatus(feedbackId, status, comment);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: '反馈不存在或更新失败'
      });
    }
    
    // 如果用户希望收到回复且状态为已解决，发送通知
    if (status === 'resolved' && updated.receiveReply) {
      sendResolutionNotification(updated, comment);
    }
    
    res.status(200).json({
      success: true,
      message: '反馈状态已更新',
      data: updated
    });
    
  } catch (error) {
    logger.error('更新反馈状态时出错', {
      feedbackId: req.params.id,
      status: req.body.status,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: '更新反馈状态失败',
      error: error.message
    });
  }
});

/**
 * 异步处理反馈通知
 */
async function processFeedbackNotification(feedback) {
  try {
    // 对于高优先级反馈（评分低或关键问题）发送通知
    if (feedback.rating <= 2 || feedback.selectedIssues.includes('checkout') || feedback.feedbackType === 'bug') {
      await feedbackService.sendHighPriorityNotification(feedback);
    }
    
    // 每日汇总处理
    await feedbackService.scheduleDailySummary();
    
  } catch (error) {
    logger.error('处理反馈通知时出错', {
      error: error.message
    });
  }
}

/**
 * 发送解决通知
 */
async function sendResolutionNotification(feedback, comment) {
  try {
    await feedbackService.sendResolutionEmail(feedback, comment);
  } catch (error) {
    logger.error('发送解决通知时出错', {
      feedbackId: feedback._id,
      error: error.message
    });
  }
}

module.exports = router;
