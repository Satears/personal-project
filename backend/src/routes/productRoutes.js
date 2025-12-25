const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/auth');

// 公开路由 - 所有人可以访问
router.get('/', productController.getProducts); // 获取产品列表
router.get('/:id', productController.getProductById); // 获取产品详情
router.get('/recommended', productController.getRecommendedProducts); // 获取推荐产品
router.get('/featured', productController.getFeaturedProducts); // 获取特色产品

// 需要认证的路由 - 用户可以添加评论
router.post('/:id/review', protect, productController.addReview); // 添加产品评论

// 管理员路由 - 需要管理员权限
router.post('/', protect, authorize('admin'), productController.createProduct); // 创建产品
router.put('/:id', protect, authorize('admin'), productController.updateProduct); // 更新产品
router.delete('/:id', protect, authorize('admin'), productController.deleteProduct); // 删除产品

module.exports = router;