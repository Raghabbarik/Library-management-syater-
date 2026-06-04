const SupportTicket = require('../models/SupportTicket');

// @desc    Create new support ticket
// @route   POST /api/support
// @access  Private (admin/librarian)
const createTicket = async (req, res, next) => {
  try {
    const { subject, message } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Please provide subject and message' });
    }

    const ticket = await SupportTicket.create({
      institutionId: req.user.institutionId || 'default_institution',
      sender: req.user._id,
      subject,
      message,
      status: 'open'
    });

    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get tickets for the institution (admin) or all tickets (super_admin)
// @route   GET /api/support
// @access  Private
const getTickets = async (req, res, next) => {
  try {
    let query = {};
    
    if (req.user.role !== 'super_admin') {
      query.institutionId = req.user.institutionId || 'default_institution';
    }

    const tickets = await SupportTicket.find(query)
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update ticket status
// @route   PATCH /api/support/:id
// @access  Private (super_admin)
const updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide status' });
    }

    let ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    ticket.status = status;
    await ticket.save();

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTicket,
  getTickets,
  updateTicketStatus
};
