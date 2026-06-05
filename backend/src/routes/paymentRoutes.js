const express = require('express');
const router = express.Router();
const {
  reportPaymentIssue,
  getPaymentIssues,
  markRefunded,
  activateSubscription
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/issue', reportPaymentIssue);
router.post('/activate', protect, authorize('admin', 'super_admin'), activateSubscription);
router.get('/issues', protect, authorize('super_admin'), getPaymentIssues);
router.patch('/issues/:id/refund', protect, authorize('super_admin'), markRefunded);

module.exports = router;
