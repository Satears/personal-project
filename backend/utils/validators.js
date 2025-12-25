/**
 * 验证器工具
 * 提供各种数据验证功能
 */

/**
 * 验证反馈输入数据
 * @param {Object} data - 待验证的数据
 * @returns {Object} 验证结果
 */
function validateFeedbackInput(data) {
  const errors = [];
  
  // 验证反馈类型
  if (!data.feedbackType) {
    errors.push('反馈类型不能为空');
  } else {
    const validTypes = ['bug', 'suggestion', 'performance', 'ui', 'content', 'other'];
    if (!validTypes.includes(data.feedbackType)) {
      errors.push('无效的反馈类型');
    }
  }
  
  // 验证评分
  if (typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
    errors.push('评分必须是1到5之间的数字');
  }
  
  // 验证描述
  if (!data.description || typeof data.description !== 'string') {
    errors.push('反馈描述不能为空');
  } else if (data.description.trim().length < 10) {
    errors.push('反馈描述至少需要10个字符');
  } else if (data.description.length > 1000) {
    errors.push('反馈描述不能超过1000个字符');
  }
  
  // 验证问题类型选择
  if (data.selectedIssues && Array.isArray(data.selectedIssues)) {
    if (data.selectedIssues.length === 0) {
      errors.push('请至少选择一个问题类型');
    } else if (data.selectedIssues.length > 5) {
      errors.push('最多只能选择5个问题类型');
    }
  }
  
  // 验证联系方式（如果提供）
  if (data.contactMethod) {
    if (typeof data.contactMethod !== 'string') {
      errors.push('联系方式格式错误');
    } else if (data.contactMethod.trim().length === 0) {
      errors.push('联系方式不能为空');
    } else if (!isValidEmail(data.contactMethod) && !isValidPhone(data.contactMethod)) {
      errors.push('请提供有效的邮箱地址或手机号码');
    }
  }
  
  // 验证是否接收回复（如果提供联系方式）
  if (data.receiveReply && data.receiveReply === true && !data.contactMethod) {
    errors.push('如果希望接收回复，请提供联系方式');
  }
  
  // 验证浏览器信息（可选）
  if (data.browserInfo && typeof data.browserInfo !== 'object') {
    errors.push('浏览器信息格式错误');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国大陆）
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
function isValidPhone(phone) {
  // 中国大陆手机号格式验证
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * 验证日期范围
 * @param {string|Date} startDate - 开始日期
 * @param {string|Date} endDate - 结束日期
 * @returns {Object} 验证结果
 */
function validateDateRange(startDate, endDate) {
  const errors = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 验证日期有效性
  if (isNaN(start.getTime())) {
    errors.push('开始日期格式无效');
  }
  
  if (isNaN(end.getTime())) {
    errors.push('结束日期格式无效');
  }
  
  // 验证日期范围
  if (start > end) {
    errors.push('开始日期不能晚于结束日期');
  }
  
  // 验证日期范围不能超过一年
  const oneYearLater = new Date(start);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  
  if (end > oneYearLater) {
    errors.push('查询范围不能超过一年');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    start,
    end
  };
}

/**
 * 验证分页参数
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Object} 验证结果
 */
function validatePagination(page, pageSize) {
  const errors = [];
  let validatedPage = parseInt(page) || 1;
  let validatedPageSize = parseInt(pageSize) || 20;
  
  // 验证页码
  if (validatedPage < 1) {
    errors.push('页码必须大于等于1');
    validatedPage = 1;
  }
  
  // 验证每页数量
  if (validatedPageSize < 1) {
    errors.push('每页数量必须大于等于1');
    validatedPageSize = 20;
  } else if (validatedPageSize > 100) {
    errors.push('每页数量不能超过100');
    validatedPageSize = 100;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    page: validatedPage,
    pageSize: validatedPageSize
  };
}

module.exports = {
  validateFeedbackInput,
  isValidEmail,
  isValidPhone,
  validateDateRange,
  validatePagination
};
