const jwt = require('jsonwebtoken');
require('dotenv').config();

// 移除硬编码的默认密钥，确保环境变量必须存在
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成JWT令牌
 * @param {Object} payload - 要加密的数据
 * @param {Object} options - JWT选项
 * @returns {string} - 生成的JWT令牌
 */
exports.generateToken = (payload, options = {}) => {
  const tokenOptions = {
    expiresIn: JWT_EXPIRES_IN,
    ...options
  };
  
  return jwt.sign(payload, JWT_SECRET, tokenOptions);
};

/**
 * 验证JWT令牌
 * @param {string} token - 要验证的JWT令牌
 * @returns {Object|null} - 解密后的用户数据或null（如果验证失败）
 */
exports.verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return null;
  }
};

/**
 * 从请求头中提取JWT令牌
 * @param {Object} req - Express请求对象
 * @returns {string|null} - 提取的令牌或null（如果未找到）
 */
exports.extractTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  const [bearer, token] = authHeader.split(' ');
  
  if (bearer.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  
  return token;
};

/**
 * 刷新JWT令牌
 * @param {string} refreshToken - 刷新令牌
 * @returns {string|null} - 新生成的访问令牌或null（如果刷新令牌无效）
 */
exports.refreshToken = (refreshToken) => {
  const decoded = exports.verifyToken(refreshToken);
  
  if (!decoded || !decoded.userId) {
    return null;
  }
  
  // 生成新的访问令牌
  const newAccessToken = exports.generateToken({
    userId: decoded.userId,
    role: decoded.role
  });
  
  return newAccessToken;
};