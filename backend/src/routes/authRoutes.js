const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { uploadAvatar } = require('../config/cloudinary');

router.post('/register', protect, uploadAvatar.single('avatar'), register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
