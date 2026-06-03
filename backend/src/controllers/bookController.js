const { db } = require('../config/firebaseAdmin');
const { cloudinary } = require('../config/cloudinary');
const { generateQRCode } = require('../utils/qrGenerator');
const { getIO } = require('../config/socket');
const { getScopedCollection, getScopedDoc, getScopedDocRefAsync } = require('../utils/dbHelper');

// @desc   Get all books with filters & pagination
// @route  GET /api/books
exports.getBooks = async (req, res) => {
  try {
    const { search, category, available, page = 1, limit = 12, institutionId } = req.query;
    
    // Get scoped collection (either a specific subcollection, or collectionGroup if super_admin with no scope)
    const booksColl = getScopedCollection(req, 'books', institutionId);
    const snapshot = await booksColl.get();
    let books = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      books.push({ id: doc.id, _id: doc.id, ...data });
    });

    // In-memory filters
    books = books.filter(b => b.isActive === true);

    if (category) {
      books = books.filter(b => b.category === category);
    }

    if (available === 'true') {
      books = books.filter(b => b.availableCopies > 0);
    }

    if (search) {
      const term = search.toLowerCase();
      books = books.filter(b => 
        (b.title && b.title.toLowerCase().includes(term)) ||
        (b.author && b.author.toLowerCase().includes(term)) ||
        (b.isbn && b.isbn.toLowerCase().includes(term))
      );
    }

    // Sort by createdAt desc in-memory
    books.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Populate addedBy user name
    for (let book of books) {
      if (book.addedBy) {
        const userDoc = await getScopedDoc(req, 'users', book.addedBy);
        book.addedBy = userDoc ? { name: userDoc.data().name } : { name: 'Unknown Admin' };
      }
    }

    const total = books.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedBooks = books.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginatedBooks,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single book
// @route  GET /api/books/:id
exports.getBook = async (req, res) => {
  try {
    const bookDoc = await getScopedDoc(req, 'books', req.params.id);
    if (!bookDoc) return res.status(404).json({ success: false, message: 'Book not found' });
    
    const bookData = bookDoc.data();
    const book = { id: bookDoc.id, _id: bookDoc.id, ...bookData };

    if (book.addedBy) {
      const userDoc = await getScopedDoc(req, 'users', book.addedBy);
      book.addedBy = userDoc ? { name: userDoc.data().name, email: userDoc.data().email } : { name: 'Unknown Admin', email: '' };
    }

    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create book
// @route  POST /api/books
exports.createBook = async (req, res) => {
  try {
    const uid = req.user._id;
    const userInstId = req.user.institutionId || 'default_institution';
    const bookData = { ...req.body, addedBy: uid, institutionId: userInstId, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    
    if (req.file) {
      bookData.coverImage = req.file.path;
      bookData.coverImagePublicId = req.file.filename;
    }
    
    bookData.totalCopies = Number(bookData.totalCopies) || 1;
    bookData.availableCopies = bookData.totalCopies;
    bookData.issuedCopies = 0;

    // Create reference inside active institution's subcollection
    const docRef = getScopedCollection(req, 'books').doc();
    const bookId = docRef.id;

    // Generate QR Code with bookId
    const qrData = JSON.stringify({ bookId, isbn: bookData.isbn, title: bookData.title });
    const qrCode = await generateQRCode(qrData);
    bookData.qrCode = qrCode;

    await docRef.set(bookData);
    const createdBook = { id: bookId, _id: bookId, ...bookData };

    getIO().to('admin_room').emit('book_added', { book: createdBook });
    res.status(201).json({ success: true, message: 'Book added successfully', data: createdBook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update book
// @route  PUT /api/books/:id
exports.updateBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const bookDocRef = await getScopedDocRefAsync(req, 'books', bookId);
    if (!bookDocRef) return res.status(404).json({ success: false, message: 'Book not found' });
    
    const bookDoc = await bookDocRef.get();
    if (!bookDoc.exists) return res.status(404).json({ success: false, message: 'Book not found' });

    const currentBook = bookDoc.data();
    const updates = { ...req.body, updatedAt: new Date().toISOString() };

    if (req.file) {
      if (currentBook.coverImagePublicId) {
        await cloudinary.uploader.destroy(currentBook.coverImagePublicId);
      }
      updates.coverImage = req.file.path;
      updates.coverImagePublicId = req.file.filename;
    }

    if (updates.totalCopies !== undefined) {
      updates.totalCopies = Number(updates.totalCopies);
      const difference = updates.totalCopies - currentBook.totalCopies;
      updates.availableCopies = Math.max(0, (currentBook.availableCopies || 0) + difference);
    }

    await bookDocRef.update(updates);
    const updatedBook = { id: bookId, _id: bookId, ...currentBook, ...updates };

    getIO().to('admin_room').emit('book_updated', { book: updatedBook });
    res.json({ success: true, message: 'Book updated', data: updatedBook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete book (soft delete)
// @route  DELETE /api/books/:id
exports.deleteBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const bookDocRef = await getScopedDocRefAsync(req, 'books', bookId);
    if (!bookDocRef) return res.status(404).json({ success: false, message: 'Book not found' });
    
    const bookDoc = await bookDocRef.get();
    if (!bookDoc.exists) return res.status(404).json({ success: false, message: 'Book not found' });

    const book = bookDoc.data();
    if (book.issuedCopies > 0) return res.status(400).json({ success: false, message: 'Cannot delete book with active issues' });

    await bookDocRef.update({ isActive: false, updatedAt: new Date().toISOString() });
    
    getIO().to('admin_room').emit('book_deleted', { bookId });
    res.json({ success: true, message: 'Book removed from catalog' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get book categories summary
// @route  GET /api/books/categories
exports.getCategories = async (req, res) => {
  try {
    const { institutionId } = req.query;
    const booksColl = getScopedCollection(req, 'books', institutionId);
    const snapshot = await booksColl.where('isActive', '==', true).get();
    const categoryMap = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const cat = data.category || 'General';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { _id: cat, count: 0, available: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].available += (Number(data.availableCopies) || 0);
    });

    const categories = Object.values(categoryMap).sort((a, b) => b.count - a.count);
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
