const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// 公开路由
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout); // 虽然前端可以直接删除token，但提供API保持一致性

// 需要认证的路由
router.get('/me', protect, authController.getMe);
router.put('/profile', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);

module.exports = router;
