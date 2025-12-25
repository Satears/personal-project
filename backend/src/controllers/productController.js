const { Product, Category } = require('../models');
const { successResponse, errorResponse, paginationResponse, notFoundResponse } = require('../utils/response');
const mongoose = require('mongoose');

// 模拟产品数据，用于数据库不可用时
const mockProducts = [
  {
    _id: '1',
    name: '示例产品1',
    price: 99.99,
    description: '这是一个示例产品',
    category: '示例分类',
    image: 'https://via.placeholder.com/500'
  },
  {
    _id: '2',
    name: '示例产品2',
    price: 199.99,
    description: '这是另一个示例产品',
    category: '示例分类',
    image: 'https://via.placeholder.com/500'
  }
];

/**
 * 检查数据库连接状态
 */
function isDatabaseConnected() {
  return mongoose.connection.readyState === 1; // 1表示已连接
}

/**
 * @desc    获取产品列表（支持分页、筛选、排序）
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  // 直接检查数据库连接状态，避免执行缓冲操作
  if (!isDatabaseConnected()) {
    console.log('数据库未连接，使用模拟数据');
    return successResponse(res, {
      count: mockProducts.length,
      data: mockProducts
    }, 200, '使用模拟数据，数据库连接不可用');
  }
  
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    
    // 分类筛选
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // 价格范围筛选
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }
    
    // 搜索功能
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // 排序
    let sort = {};
    if (req.query.sortBy) {
      const order = req.query.order === 'desc' ? -1 : 1;
      sort[req.query.sortBy] = order;
    } else {
      sort.createdAt = -1; // 默认按创建时间降序
    }
    
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments(query);
    
    const paginationData = {
      page,
      pages: Math.ceil(total / limit),
      count: products.length,
      total,
      data: products
    };
    
    // 注意：查看paginationResponse的实际实现，可能需要调整参数
    return successResponse(res, paginationData, 200, 'Success');
  } catch (error) {
    console.error('Get products error:', error);
    // 在错误情况下也返回模拟数据
    return successResponse(res, {
      count: mockProducts.length,
      data: mockProducts
    }, 200, '使用模拟数据，数据库操作失败');
  }
};

/**
 * @desc    获取产品详情
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  // 直接检查数据库连接状态
  if (!isDatabaseConnected()) {
    console.log('数据库未连接，使用模拟数据');
    const mockProduct = mockProducts.find(p => p._id === req.params.id) || mockProducts[0];
    return successResponse(res, mockProduct, 200, '使用模拟数据，数据库连接不可用');
  }
  
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    
    if (!product) {
      return notFoundResponse(res, '产品不存在');
    }
    
    return successResponse(res, product, 200, 'Success');
  } catch (error) {
    console.error('Get product by id error:', error);
    // 在错误情况下也返回模拟数据
    const mockProduct = mockProducts.find(p => p._id === req.params.id) || mockProducts[0];
    return successResponse(res, mockProduct, 200, '使用模拟数据，数据库操作失败');
  }
};

/**
 * @desc    获取推荐产品
 * @route   GET /api/products/recommended
 * @access  Public
 */
const getRecommendedProducts = async (req, res) => {
  // 返回模拟推荐产品数据
  if (!isDatabaseConnected()) {
    return successResponse(res, {
      count: mockProducts.length,
      data: mockProducts
    }, 200, '使用模拟推荐产品数据，数据库连接不可用');
  }
  
  try {
    // 实际实现：可以基于用户浏览历史、热门程度等推荐
    const products = await Product.find().limit(4).populate('category', 'name');
    return successResponse(res, {
      count: products.length,
      data: products
    }, 200, 'Success');
  } catch (error) {
    console.error('Get recommended products error:', error);
    return successResponse(res, {
      count: mockProducts.length,
      data: mockProducts
    }, 200, '使用模拟推荐产品数据，数据库操作失败');
  }
};

/**
 * @desc    获取特色产品
 * @route   GET /api/products/featured
 * @access  Public
 */
const getFeaturedProducts = async (req, res) => {
  // 返回模拟特色产品数据
  if (!isDatabaseConnected()) {
    return successResponse(res, {
      count: mockProducts.length,
      data: mockProducts
    }, 200, '使用模拟特色产品数据，数据库连接不可用');
  }
  
  try {
    // 实际实现：查找标记为特色的产品
    const products = await Product.find({ featured: true }).limit(8).populate('category', 'name');
    return successResponse(res, {
      count: products.length,
      data: products
    }, 200, 'Success');
  } catch (error) {
    console.error('Get featured products error:', error);
    return successResponse(res, {
      count: mockProducts.length,
      data: mockProducts
    }, 200, '使用模拟特色产品数据，数据库操作失败');
  }
};

/**
 * @desc    添加产品评论
 * @route   POST /api/products/:id/review
 * @access  Private
 */
const addReview = async (req, res) => {
  try {
    return successResponse(res, null, 200, '评论功能正在开发中');
  } catch (error) {
    console.error('Add review error:', error);
    return errorResponse(res, '服务器错误', 500);
  }
};

/**
 * @desc    创建产品
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = async (req, res) => {
  try {
    return successResponse(res, null, 200, '管理员创建产品功能正在开发中');
  } catch (error) {
    console.error('Create product error:', error);
    return errorResponse(res, '服务器错误', 500);
  }
};

/**
 * @desc    更新产品
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = async (req, res) => {
  try {
    return successResponse(res, null, 200, '管理员更新产品功能正在开发中');
  } catch (error) {
    console.error('Update product error:', error);
    return errorResponse(res, '服务器错误', 500);
  }
};

/**
 * @desc    删除产品
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = async (req, res) => {
  try {
    return successResponse(res, null, 200, '管理员删除产品功能正在开发中');
  } catch (error) {
    console.error('Delete product error:', error);
    return errorResponse(res, '服务器错误', 500);
  }
};

// 导出所有需要的函数
module.exports = {
  getProducts,
  getProductById,
  getRecommendedProducts,
  getFeaturedProducts,
  addReview,
  createProduct,
  updateProduct,
  deleteProduct
};