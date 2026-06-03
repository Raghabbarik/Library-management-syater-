const express = require('express');
const router = express.Router();
const { getNotifications, markRead, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getNotifications);
router.patch('/mark-read', protect, markRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
