const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// @desc    创建新订单
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;
  
  // 验证输入
  if (!shippingAddress || !paymentMethod) {
    res.status(400);
    throw new Error('请提供完整的订单信息');
  }
  
  // 获取用户的购物车
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('购物车为空，无法创建订单');
  }
  
  // 检查库存并创建订单项
  const orderItems = [];
  let totalAmount = 0;
  
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      res.status(404);
      throw new Error(`商品不存在: ${item.product}`);
    }
    
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`商品 ${product.name} 库存不足`);
    }
    
    // 更新库存
    product.stock -= item.quantity;
    await product.save();
    
    // 添加到订单项
    orderItems.push({
      product: product._id,
      name: product.name,
      quantity: item.quantity,
      price: product.price,
      image: product.images[0]
    });
    
    totalAmount += product.price * item.quantity;
  }
  
  // 创建订单
  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    totalAmount,
    status: 'pending'
  });
  
  // 清空购物车
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $set: { items: [], totalItems: 0, totalPrice: 0 } }
  );
  
  res.status(201).json({
    status: 'success',
    data: order
  });
});

// @desc    获取用户的订单列表
// @route   GET /api/orders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('orderItems.product', 'name price images');
  
  res.status(200).json({
    status: 'success',
    count: orders.length,
    data: orders
  });
});

// @desc    获取订单详情
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product', 'name price images');
  
  if (!order) {
    res.status(404);
    throw new Error('订单不存在');
  }
  
  // 检查权限（仅订单所属用户或管理员可访问）
  if (order.user._id.toString() !== req.user._id.toString() && !req.user.role === 'admin') {
    res.status(403);
    throw new Error('无权访问此订单');
  }
  
  res.status(200).json({
    status: 'success',
    data: order
  });
});

// @desc    管理员获取所有订单
// @route   GET /api/orders/admin
// @access  Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .populate('user', 'name email')
    .populate('orderItems.product', 'name price');
  
  res.status(200).json({
    status: 'success',
    count: orders.length,
    data: orders
  });
});

// @desc    更新订单状态
// @route   PUT /api/orders/:id/status
// @access  Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  // 验证状态
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`无效的订单状态: ${status}`);
  }
  
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error('订单不存在');
  }
  
  // 更新订单状态
  order.status = status;
  
  // 如果取消订单，恢复库存
  if (status === 'cancelled' && order.status !== 'cancelled') {
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }
  }
  
  await order.save();
  
  res.status(200).json({
    status: 'success',
    data: order
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
};
