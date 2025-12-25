const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse } = require('../utils/response');

/**
 * 用户注册
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, phone, address } = req.body;
    
    // 验证必要字段
    if (!username || !email || !password) {
      return validationErrorResponse(res, {
        username: username ? null : '用户名不能为空',
        email: email ? null : '邮箱不能为空',
        password: password ? null : '密码不能为空'
      });
    }
    
    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return validationErrorResponse(res, {
        username: '用户名已存在'
      });
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return validationErrorResponse(res, {
        email: '邮箱已被注册'
      });
    }
    
    // 创建新用户
    const user = await User.create({
      username,
      email,
      password,
      phone,
      address
    });
    
    // 生成JWT令牌
    const token = generateToken({
      userId: user._id,
      role: user.role
    });
    
    // 返回用户信息和令牌（不包含密码）
    const userData = user.toObject();
    delete userData.password;
    
    return successResponse(res, {
      user: userData,
      token
    }, 201, '注册成功');
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * 用户登录
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 验证必要字段
    if (!email || !password) {
      return validationErrorResponse(res, {
        email: email ? null : '邮箱不能为空',
        password: password ? null : '密码不能为空'
      });
    }
    
    // 查找用户并包含密码字段
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return unauthorizedResponse(res, '邮箱或密码错误');
    }
    
    // 检查用户是否激活
    if (!user.isActive) {
      return unauthorizedResponse(res, '您的账户已被禁用');
    }
    
    // 验证密码
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return unauthorizedResponse(res, '邮箱或密码错误');
    }
    
    // 生成JWT令牌
    const token = generateToken({
      userId: user._id,
      role: user.role
    });
    
    // 返回用户信息和令牌（不包含密码）
    const userData = user.toObject();
    delete userData.password;
    
    return successResponse(res, {
      user: userData,
      token
    }, 200, '登录成功');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * 获取当前用户信息
 */
exports.getMe = async (req, res) => {
  try {
    // 用户信息已在认证中间件中设置
    return successResponse(res, req.user, 200, '获取用户信息成功');
  } catch (error) {
    console.error('Get user info error:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * 更新用户信息
 */
exports.updateProfile = async (req, res) => {
  try {
    const { username, phone, address, avatar } = req.body;
    
    // 检查用户名是否已被其他用户使用
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return validationErrorResponse(res, {
          username: '用户名已存在'
        });
      }
    }
    
    // 更新用户信息
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { username, phone, address, avatar },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return errorResponse(res, '用户不存在', 404);
    }
    
    return successResponse(res, updatedUser, 200, '个人信息更新成功');
  } catch (error) {
    console.error('Update profile error:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * 修改密码
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return validationErrorResponse(res, {
        currentPassword: currentPassword ? null : '当前密码不能为空',
        newPassword: newPassword ? null : '新密码不能为空'
      });
    }
    
    // 获取用户并包含密码
    const user = await User.findById(req.userId).select('+password');
    
    // 验证当前密码
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return validationErrorResponse(res, {
        currentPassword: '当前密码错误'
      });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    return successResponse(res, null, 200, '密码修改成功');
  } catch (error) {
    console.error('Change password error:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * 用户登出（客户端删除token）
 */
exports.logout = async (req, res) => {
  try {
    return successResponse(res, null, 200, '登出成功');
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, error.message);
  }
};