// 统一响应格式工具函数

/**
 * 成功响应
 * @param {Response} res - Express响应对象
 * @param {Object} data - 响应数据
 * @param {number} statusCode - HTTP状态码
 * @param {string} message - 响应消息
 */
exports.successResponse = (res, data = null, statusCode = 200, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * 错误响应
 * @param {Response} res - Express响应对象
 * @param {string|Error} error - 错误信息或错误对象
 * @param {number} statusCode - HTTP状态码
 */
exports.errorResponse = (res, error = 'Something went wrong', statusCode = 500) => {
  // 如果是Error对象，提取错误信息
  const errorMessage = error instanceof Error ? error.message : error;
  
  return res.status(statusCode).json({
    success: false,
    message: errorMessage,
    data: null
  });
};

/**
 * 验证错误响应
 * @param {Response} res - Express响应对象
 * @param {Object} errors - 验证错误对象
 */
exports.validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: errors
  });
};

/**
 * 分页响应
 * @param {Response} res - Express响应对象
 * @param {Array} items - 数据项数组
 * @param {Object} pagination - 分页信息
 * @param {string} message - 响应消息
 */
exports.paginatedResponse = (res, items, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination
    }
  });
};

/**
 * 未授权响应
 * @param {Response} res - Express响应对象
 * @param {string} message - 响应消息
 */
exports.unauthorizedResponse = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    message,
    data: null
  });
};

/**
 * 禁止访问响应
 * @param {Response} res - Express响应对象
 * @param {string} message - 响应消息
 */
exports.forbiddenResponse = (res, message = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    message,
    data: null
  });
};

/**
 * 未找到响应
 * @param {Response} res - Express响应对象
 * @param {string} message - 响应消息
 */
exports.notFoundResponse = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    message,
    data: null
  });
};