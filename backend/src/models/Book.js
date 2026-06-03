const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Fiction', 'Non-Fiction', 'Science', 'Technology', 'History',
      'Biography', 'Mathematics', 'Arts', 'Philosophy', 'Religion',
      'Law', 'Medical', 'Engineering', 'Business', 'Literature', 'Other'
    ],
  },
  description: { type: String, trim: true, maxlength: [2000, 'Description too long'] },
  coverImage: { type: String, default: '' },
  coverImagePublicId: { type: String, default: '' },
  publisher: { type: String, trim: true },
  publishedYear: { type: Number },
  edition: { type: String, trim: true },
  language: { type: String, default: 'English' },
  pages: { type: Number },
  location: {
    shelf: { type: String, trim: true },
    row: { type: String, trim: true },
    section: { type: String, trim: true },
  },
  totalCopies: { type: Number, required: true, default: 1, min: 0 },
  availableCopies: { type: Number, required: true, default: 1, min: 0 },
  issuedCopies: { type: Number, default: 0 },
  reservedCopies: { type: Number, default: 0 },
  tags: [{ type: String, lowercase: true, trim: true }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  totalIssued: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  qrCode: { type: String, default: '' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

bookSchema.index({ title: 'text', author: 'text', isbn: 'text', tags: 'text' });
bookSchema.index({ category: 1, isActive: 1 });

bookSchema.virtual('isAvailable').get(function () {
  return this.availableCopies > 0;
});

module.exports = mongoose.model('Book', bookSchema);
