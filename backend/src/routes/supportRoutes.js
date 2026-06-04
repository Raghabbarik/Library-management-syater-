const express = require('express');
const { createTicket, getTickets, updateTicketStatus } = require('../controllers/supportController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

router.route('/')
  .post(createTicket)
  .get(getTickets);

router.route('/:id')
  .patch(authorize('super_admin'), updateTicketStatus);

module.exports = router;
