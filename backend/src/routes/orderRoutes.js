const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/auth');

// 普通用户订单路由
router.get('/', protect, orderController.getMyOrders); // 获取当前用户的订单列表
router.post('/', protect, orderController.createOrder); // 创建新订单
router.get('/:id', protect, orderController.getOrderById); // 获取订单详情

// 管理员订单路由
router.get('/admin/all', protect, authorize('admin'), orderController.getAllOrders); // 获取所有订单
router.put('/:id/status', protect, authorize('admin'), orderController.updateOrderStatus); // 更新订单状态

module.exports = router;