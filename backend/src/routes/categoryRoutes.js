const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middlewares/auth');

// 公开路由
router.get('/', categoryController.getCategories); // 获取所有分类
router.get('/:id', categoryController.getCategoryById); // 获取单个分类

// 管理员路由
router.post('/', protect, authorize('admin'), categoryController.createCategory); // 创建分类
router.put('/:id', protect, authorize('admin'), categoryController.updateCategory); // 更新分类
router.delete('/:id', protect, authorize('admin'), categoryController.deleteCategory); // 删除分类

module.exports = router;