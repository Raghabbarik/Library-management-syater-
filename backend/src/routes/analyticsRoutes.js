const express = require('express');
const router = express.Router();
const { getSummary, getTrend, getTopBooks, getCategoryDistribution } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/summary', protect, authorize('admin', 'librarian'), getSummary);
router.get('/trend', protect, authorize('admin', 'librarian'), getTrend);
router.get('/top-books', protect, authorize('admin', 'librarian'), getTopBooks);
router.get('/categories', protect, authorize('admin', 'librarian'), getCategoryDistribution);

module.exports = router;
