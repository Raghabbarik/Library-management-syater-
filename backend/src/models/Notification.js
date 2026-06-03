const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['book_issued', 'book_returned', 'overdue', 'fine_paid', 'new_book', 'system', 'reminder'],
    default: 'system',
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  relatedTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  relatedBook: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
