const { Category } = require('../models');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/response');
const mongoose = require('mongoose');

// 模拟分类数据，用于数据库不可用时
const mockCategories = [
  {
    _id: '1',
    name: '示例分类1',
    description: '这是一个示例分类',
    image: 'https://via.placeholder.com/300'
  },
  {
    _id: '2',
    name: '示例分类2',
    description: '这是另一个示例分类',
    image: 'https://via.placeholder.com/300'
  }
];

/**
 * 检查数据库连接状态
 */
function isDatabaseConnected() {
  return mongoose.connection.readyState === 1; // 1表示已连接
}

/**
 * @desc    获取分类列表
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = async (req, res) => {
  try {
    // 检查数据库连接状态
    if (!isDatabaseConnected()) {
      console.log('数据库未连接，使用模拟数据');
      return successResponse(res, mockCategories, 200, '使用模拟数据，数据库连接不可用');
    }

    const categories = await Category.find();
    
    if (categories.length === 0) {
      // 数据库已连接但无数据，使用模拟数据
      return successResponse(res, mockCategories, 200, '数据库中没有分类数据，使用模拟数据');
    }
    
    return successResponse(res, categories, 200, 'Success');
  } catch (error) {
    console.error('Get categories error:', error);
    // 在错误情况下返回模拟数据
    return successResponse(res, mockCategories, 200, '使用模拟数据，数据库操作失败');
  }
};

/**
 * @desc    获取分类详情
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = async (req, res) => {
  try {
    // 检查数据库连接状态
    if (!isDatabaseConnected()) {
      console.log('数据库未连接，使用模拟数据');
      const mockCategory = mockCategories.find(c => c._id === req.params.id) || mockCategories[0];
      return successResponse(res, mockCategory, 200, '使用模拟数据，数据库连接不可用');
    }

    const category = await Category.findById(req.params.id);
    
    if (!category) {
      // 数据库中未找到，使用模拟数据
      const mockCategory = mockCategories.find(c => c._id === req.params.id) || mockCategories[0];
      return successResponse(res, mockCategory, 200, '分类不存在，使用模拟数据');
    }
    
    return successResponse(res, category, 200, 'Success');
  } catch (error) {
    console.error('Get category by id error:', error);
    // 在错误情况下返回模拟数据
    const mockCategory = mockCategories.find(c => c._id === req.params.id) || mockCategories[0];
    return successResponse(res, mockCategory, 200, '使用模拟数据，数据库操作失败');
  }
};

/**
 * @desc    创建分类
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = async (req, res) => {
  try {
    // 简单实现，返回成功消息
    return successResponse(res, null, 200, '管理员创建分类功能正在开发中');
  } catch (error) {
    console.error('Create category error:', error);
    return errorResponse(res, '服务器错误', 500);
  }
};

/**
 * @desc    更新分类
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = async (req, res) => {
  try {
    // 简单实现，返回成功消息
    return successResponse(res, null, 200, '管理员更新分类功能正在开发中');
  } catch (error) {
    console.error('Update category error:', error);
    return errorResponse(res, '服务器错误', 500);
  }
};

/**
 * @desc    删除分类
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = async (req, res) => {
  try {
    // 简单实现，返回成功消息
    return successResponse(res, null, 200, '管理员删除分类功能正在开发中');
  } catch (error) {
    console.error('Delete category error:', error);
    return errorResponse(res, '服务器错误', 500);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};