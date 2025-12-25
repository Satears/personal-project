const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { unauthorizedResponse, forbiddenResponse } = require('../utils/response');
const { User } = require('../models');

/**
 * 认证中间件 - 验证用户是否已登录
 */
exports.protect = async (req, res, next) => {
  try {
    // 从请求头中提取令牌
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return unauthorizedResponse(res, '请先登录');
    }
    
    // 验证令牌
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return unauthorizedResponse(res, '无效的认证令牌');
    }
    
    // 查找用户
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return unauthorizedResponse(res, '用户不存在');
    }
    
    // 检查用户是否激活
    if (!user.isActive) {
      return forbiddenResponse(res, '您的账户已被禁用');
    }
    
    // 将用户信息添加到请求对象中
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return unauthorizedResponse(res, '认证失败');
  }
};

/**
 * 角色授权中间件 - 验证用户角色
 * @param {...string} roles - 允许的角色列表
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorizedResponse(res, '请先登录');
    }
    
    if (!roles.includes(req.user.role)) {
      return forbiddenResponse(res, '您没有权限执行此操作');
    }
    
    next();
  };
};

/**
 * 可选认证中间件 - 不强制要求登录，但如果有令牌则解析用户信息
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      return next();
    }
    
    const decoded = verifyToken(token);
    
    if (decoded && decoded.userId) {
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    // 如果认证失败，不阻止请求继续，只是不设置用户信息
    next();
  }
};

/**
 * 验证当前用户是否为资源所有者
 * @param {string} model - 模型名称
 * @param {string} paramName - 路由参数名称
 * @param {string} ownerField - 所有者字段名
 */
exports.isOwner = (model, paramName = 'id', ownerField = 'user') => {
  const Model = require('../models')[model];
  
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        });
      }
      
      // 检查是否为管理员或资源所有者
      const isAdmin = req.user && req.user.role === 'admin';
      const isOwner = resource[ownerField] && resource[ownerField].toString() === req.userId.toString();
      
      if (!isAdmin && !isOwner) {
        return forbiddenResponse(res, '您没有权限访问此资源');
      }
      
      next();
    } catch (error) {
      console.error('Ownership verification error:', error);
      return res.status(500).json({
        success: false,
        message: '服务器错误'
      });
    }
  };
};