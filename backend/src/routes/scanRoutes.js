const express = require('express');
const router = express.Router();
const { scan, getLogs, getTodayCount, studentScan, getCurrentlyInside, exitUser, getSessions } = require('../controllers/scanController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', protect, authorize('admin', 'librarian'), scan);
router.post('/student-scan', protect, studentScan);
router.get('/logs', protect, getLogs);
router.get('/sessions', protect, getSessions);
router.get('/today-count', protect, authorize('admin', 'librarian'), getTodayCount);
router.get('/inside', protect, authorize('admin', 'librarian'), getCurrentlyInside);
router.post('/exit/:userId', protect, authorize('admin', 'librarian'), exitUser);

module.exports = router;
