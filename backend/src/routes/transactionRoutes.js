const express = require('express');
const router = express.Router();
const { 
  issueBook, returnBook, renewBook, payFine, getTransactions, getOverdue, requestBook, cancelRequest 
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', protect, getTransactions);
router.get('/overdue', protect, authorize('admin', 'librarian'), getOverdue);
router.post('/issue', protect, authorize('admin', 'librarian'), issueBook);
router.post('/return', protect, authorize('admin', 'librarian'), returnBook);
router.post('/renew', protect, renewBook);
router.post('/pay-fine', protect, authorize('admin', 'librarian'), payFine);

// Student request routes
router.post('/request', protect, requestBook);
router.delete('/request/:id', protect, cancelRequest);

module.exports = router;
