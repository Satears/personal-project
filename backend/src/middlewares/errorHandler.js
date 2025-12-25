const winston = require('winston');
require('dotenv').config();

// 创建日志记录器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * 基础错误类，扩展自Error
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational; // 可操作的错误（非编程错误）
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 400 Bad Request 错误
 */
class BadRequestError extends AppError {
  constructor(message = '请求参数无效') {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized 错误
 */
class UnauthorizedError extends AppError {
  constructor(message = '未授权访问') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden 错误
 */
class ForbiddenError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403);
  }
}

/**
 * 404 Not Found 错误
 */
class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404);
  }
}

/**
 * 409 Conflict 错误
 */
class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409);
  }
}

/**
 * 500 Internal Server Error 错误
 */
class InternalServerError extends AppError {
  constructor(message = '服务器内部错误') {
    super(message, 500);
  }
}

/**
 * 处理无效JWT令牌错误
 */
class InvalidTokenError extends AppError {
  constructor(message = '无效的令牌') {
    super(message, 401);
  }
}

/**
 * 处理过期JWT令牌错误
 */
class TokenExpiredError extends AppError {
  constructor(message = '令牌已过期') {
    super(message, 401);
  }
}

/**
 * 处理MongoDB错误
 */
const handleMongoError = (err) => {
  let message;
  
  // 处理重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `该${field}已被使用，请使用其他值`;
    return new ConflictError(message);
  }
  
  // 处理验证错误
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(el => el.message).join('. ');
    return new BadRequestError(message);
  }
  
  // 处理ObjectId错误
  if (err.name === 'CastError') {
    message = `无效的资源ID: ${err.value}`;
    return new BadRequestError(message);
  }
  
  // 其他MongoDB错误
  return new InternalServerError('数据库操作失败');
};

/**
 * 处理JWT错误
 */
const handleJWTError = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return new InvalidTokenError('无效的认证令牌');
  }
  
  if (err.name === 'TokenExpiredError') {
    return new TokenExpiredError('认证令牌已过期');
  }
  
  return new UnauthorizedError('认证失败');
};

/**
 * 开发环境错误响应
 */
const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

/**
 * 生产环境错误响应
 */
const sendErrorProd = (err, req, res) => {
  // 可操作的错误（由我们的AppError类创建）
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  
  // 记录错误到日志
  logger.error('未处理的错误', { 
    error: err,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // 编程错误或未知错误 - 不向客户端暴露详细信息
  return res.status(500).json({
    status: 'error',
    message: '服务器内部错误，请稍后再试'
  });
};

/**
 * 全局错误处理中间件
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // 记录所有错误
  logger.error(`${err.status} - ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack
  });
  
  // 环境特定的错误处理
  if (process.env.NODE_ENV === 'development') {
    return sendErrorDev(err, req, res);
  }
  
  // 生产环境错误处理
  let error = { ...err };
  error.message = err.message;
  
  // 处理特定类型的错误
  if (err.name.startsWith('Mongo')) {
    error = handleMongoError(error);
  } else if (err.name.includes('Token')) {
    error = handleJWTError(error);
  }
  
  return sendErrorProd(error, req, res);
};

/**
 * 404 错误处理中间件
 */
const notFoundHandler = (req, res, next) => {
  const err = new NotFoundError(`找不到请求的路径: ${req.originalUrl}`);
  next(err);
};

/**
 * 异步错误处理包装器
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  InvalidTokenError,
  TokenExpiredError,
  globalErrorHandler,
  notFoundHandler,
  catchAsync,
  logger
};
