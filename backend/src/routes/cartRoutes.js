const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/auth');

// 购物车相关路由 - 所有路由都需要用户登录
router.get('/', protect, cartController.getCart); // 获取购物车
router.post('/add', protect, cartController.addToCart); // 添加商品到购物车
router.put('/update', protect, cartController.updateCartItem); // 更新购物车商品数量
router.delete('/:itemId', protect, cartController.removeFromCart); // 从购物车中删除商品
router.delete('/clear', protect, cartController.clearCart); // 清空购物车

module.exports = router;