const mongoose = require('mongoose');

const FINE_RATE_PER_DAY = 2; // ₹2 per day overdue

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  type: {
    type: String,
    enum: ['issue', 'return', 'renew', 'reserve', 'cancel_reserve'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue', 'lost', 'reserved', 'cancelled'],
    default: 'active',
  },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  renewCount: { type: Number, default: 0, max: 2 },
  fine: {
    amount: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date },
    paidAmount: { type: Number, default: 0 },
  },
  notes: { type: String, trim: true },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto-calculate fine
transactionSchema.methods.calculateFine = function () {
  if (this.status === 'returned' || this.returnDate) return 0;
  const now = new Date();
  if (now <= this.dueDate) return 0;
  const daysOverdue = Math.ceil((now - this.dueDate) / (1000 * 60 * 60 * 24));
  return daysOverdue * FINE_RATE_PER_DAY;
};

transactionSchema.index({ user: 1, status: 1 });
transactionSchema.index({ book: 1, status: 1 });
transactionSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
