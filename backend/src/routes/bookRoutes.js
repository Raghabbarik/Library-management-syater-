const express = require('express');
const router = express.Router();
const { getBooks, getBook, createBook, updateBook, deleteBook, getCategories } = require('../controllers/bookController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/', protect, getBooks);
router.get('/categories', protect, getCategories);
router.get('/:id', protect, getBook);
router.post('/', protect, authorize('admin', 'librarian'), upload.single('coverImage'), createBook);
router.put('/:id', protect, authorize('admin', 'librarian'), upload.single('coverImage'), updateBook);
router.delete('/:id', protect, authorize('admin'), deleteBook);

module.exports = router;
