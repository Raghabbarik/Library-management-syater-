const { admin, db } = require('../config/firebaseAdmin');
const { getIO } = require('../config/socket');
const { getScopedCollection, getScopedDoc, getScopedDocRefAsync, getScopedDocRef } = require('../utils/dbHelper');

const ISSUE_DURATION_DAYS = 14;
const FINE_RATE_PER_DAY = 2; // ₹2 per day overdue

const calculateFine = (dueDate, status, returnDate) => {
  if (status === 'returned' || returnDate) return 0;
  const now = new Date();
  const due = new Date(dueDate);
  if (now <= due) return 0;
  const daysOverdue = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
  return daysOverdue * FINE_RATE_PER_DAY;
};

const createNotification = async (userId, title, message, type, extras = {}) => {
  // Find recipient's institutionId
  let userInstId = 'default_institution';
  const userIndexDoc = await db.collection('userIndex').doc(userId).get();
  if (userIndexDoc.exists) {
    userInstId = userIndexDoc.data().institutionId || 'default_institution';
  }

  const notifData = {
    recipient: userId,
    title,
    message,
    type,
    isRead: false,
    createdAt: new Date().toISOString(),
    institutionId: userInstId,
    ...extras
  };
  const docRef = await db.collection('institutions').doc(userInstId).collection('notifications').add(notifData);
  const notif = { id: docRef.id, _id: docRef.id, ...notifData };
  getIO().to(`user_${userId}`).emit('new_notification', notif);
  return notif;
};

// @desc   Issue a book
// @route  POST /api/transactions/issue
exports.issueBook = async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    const userDoc = await getScopedDoc(req, 'users', userId);
    const bookDoc = await getScopedDoc(req, 'books', bookId);

    if (!userDoc) return res.status(404).json({ success: false, message: 'User not found' });
    if (!bookDoc) return res.status(404).json({ success: false, message: 'Book not found' });

    const user = userDoc.data();
    const book = bookDoc.data();

    if ((book.availableCopies || 0) < 1) return res.status(400).json({ success: false, message: 'No copies available' });
    if ((user.pendingFines || 0) > 0) return res.status(400).json({ success: false, message: 'Clear pending fines before borrowing' });

    // Check if user already has this book issued inside this institution
    const txCollection = getScopedCollection(req, 'transactions');
    const existingSnapshot = await txCollection
      .where('user', '==', userId)
      .where('book', '==', bookId)
      .where('status', '==', 'active')
      .get();

    if (!existingSnapshot.empty) {
      return res.status(400).json({ success: false, message: 'User already has this book issued' });
    }

    const issueDate = new Date().toISOString();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + ISSUE_DURATION_DAYS);
    const dueDateStr = dueDate.toISOString();

    const userInstId = user.institutionId || 'default_institution';

    const transactionData = {
      user: userId,
      book: bookId,
      type: 'issue',
      status: 'active',
      issueDate,
      dueDate: dueDateStr,
      renewCount: 0,
      fine: {
        amount: 0,
        paid: false,
        paidAmount: 0
      },
      issuedBy: req.user._id,
      institutionId: userInstId,
      createdAt: issueDate
    };

    const docRef = await txCollection.add(transactionData);
    const transId = docRef.id;

    // Update book & user counts in their respective subcollections
    const userDocRef = userDoc.ref;
    const bookDocRef = bookDoc.ref;

    await Promise.all([
      bookDocRef.update({
        availableCopies: (book.availableCopies || 1) - 1,
        issuedCopies: (book.issuedCopies || 0) + 1,
        totalIssued: (book.totalIssued || 0) + 1,
        updatedAt: new Date().toISOString()
      }),
      userDocRef.update({
        totalBooksIssued: (user.totalBooksIssued || 0) + 1,
        currentlyBorrowed: (user.currentlyBorrowed || 0) + 1,
        updatedAt: new Date().toISOString()
      })
    ]);

    // Resolve any pending request for this book by this student
    const pendingRequestSnapshot = await txCollection
      .where('user', '==', userId)
      .where('book', '==', bookId)
      .where('type', '==', 'request')
      .where('status', '==', 'pending')
      .get();

    if (!pendingRequestSnapshot.empty) {
      const requestBatch = db.batch();
      pendingRequestSnapshot.forEach(doc => {
        requestBatch.update(doc.ref, { status: 'approved', updatedAt: new Date().toISOString() });
      });
      await requestBatch.commit();
    }

    const transaction = {
      id: transId,
      _id: transId,
      ...transactionData,
      user: { id: userId, _id: userId, name: user.name, studentId: user.studentId },
      book: { id: bookId, _id: bookId, title: book.title, author: book.author, isbn: book.isbn },
      issuedBy: { id: req.user._id, _id: req.user._id, name: req.user.name }
    };

    await createNotification(userId, 'Book Issued', `"${book.title}" issued. Due: ${dueDate.toDateString()}`, 'book_issued', {
      relatedTransaction: transId, relatedBook: bookId,
    });

    getIO().to(`admin_room_${userInstId}`).emit('book_issued', { transaction });
    res.status(201).json({ success: true, message: 'Book issued successfully', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Return a book
// @route  POST /api/transactions/return
exports.returnBook = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transDoc = await getScopedDoc(req, 'transactions', transactionId);
    if (!transDoc) return res.status(404).json({ success: false, message: 'Transaction not found' });
    
    const transaction = transDoc.data();
    if (transaction.status === 'returned') return res.status(400).json({ success: false, message: 'Book already returned' });

    const userInstId = transaction.institutionId || 'default_institution';
    const userDocRef = db.collection('institutions').doc(userInstId).collection('users').doc(transaction.user);
    const bookDocRef = db.collection('institutions').doc(userInstId).collection('books').doc(transaction.book);

    const [userDoc, bookDoc] = await Promise.all([userDocRef.get(), bookDocRef.get()]);
    if (!userDoc.exists || !bookDoc.exists) {
      return res.status(404).json({ success: false, message: 'Referenced user or book not found' });
    }
    const user = userDoc.data();
    const book = bookDoc.data();

    const fine = calculateFine(transaction.dueDate, transaction.status, transaction.returnDate);
    const returnDate = new Date().toISOString();

    const updates = {
      returnDate,
      status: 'returned',
      returnedBy: req.user._id,
      updatedAt: returnDate
    };

    if (fine > 0) {
      updates.fine = {
        amount: fine,
        paid: false,
        paidAmount: 0
      };
    }

    await transDoc.ref.update(updates);

    // Update book & user counts
    await Promise.all([
      bookDocRef.update({
        availableCopies: (book.availableCopies || 0) + 1,
        issuedCopies: Math.max(0, (book.issuedCopies || 1) - 1),
        updatedAt: new Date().toISOString()
      }),
      userDocRef.update({
        currentlyBorrowed: Math.max(0, (user.currentlyBorrowed || 1) - 1),
        pendingFines: (user.pendingFines || 0) + fine,
        updatedAt: new Date().toISOString()
      })
    ]);

    const populatedTransaction = {
      id: transactionId,
      _id: transactionId,
      ...transaction,
      ...updates,
      user: { id: userDoc.id, _id: userDoc.id, name: user.name, studentId: user.studentId },
      book: { id: bookDoc.id, _id: bookDoc.id, title: book.title, author: book.author, isbn: book.isbn }
    };

    await createNotification(transaction.user, 'Book Returned',
      `"${book.title}" returned.${fine > 0 ? ` Fine: ₹${fine}` : ''}`, 'book_returned', {
        relatedTransaction: transactionId, relatedBook: bookDoc.id,
      });

    getIO().to(`admin_room_${userInstId}`).emit('book_returned', { transaction: populatedTransaction });
    res.json({ success: true, message: 'Book returned successfully', fine, data: populatedTransaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Renew a book
// @route  POST /api/transactions/renew
exports.renewBook = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const transDocRef = await getScopedDocRefAsync(req, 'transactions', transactionId);
    if (!transDocRef) return res.status(404).json({ success: false, message: 'Transaction not found' });
    
    const transDoc = await transDocRef.get();
    if (!transDoc.exists) return res.status(404).json({ success: false, message: 'Transaction not found' });
    
    const transaction = transDoc.data();
    if (transaction.status !== 'active') return res.status(400).json({ success: false, message: 'Only active transactions can be renewed' });
    if ((transaction.renewCount || 0) >= 2) return res.status(400).json({ success: false, message: 'Maximum renewal limit reached (2)' });

    const fine = calculateFine(transaction.dueDate, transaction.status, transaction.returnDate);
    if (fine > 0) return res.status(400).json({ success: false, message: 'Clear overdue fine before renewing' });

    const oldDueDate = new Date(transaction.dueDate);
    const newDueDate = new Date(oldDueDate.getTime() + ISSUE_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const updates = {
      dueDate: newDueDate.toISOString(),
      renewCount: (transaction.renewCount || 0) + 1,
      updatedAt: new Date().toISOString()
    };

    await transDocRef.update(updates);
    res.json({ success: true, message: 'Book renewed successfully', data: { id: transactionId, _id: transactionId, ...transaction, ...updates } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Pay fine
// @route  POST /api/transactions/pay-fine
exports.payFine = async (req, res) => {
  try {
    const { transactionId, amount } = req.body;
    const transDocRef = await getScopedDocRefAsync(req, 'transactions', transactionId);
    if (!transDocRef) return res.status(404).json({ success: false, message: 'Transaction not found' });
    
    const transDoc = await transDocRef.get();
    if (!transDoc.exists) return res.status(404).json({ success: false, message: 'Transaction not found' });
    
    const transaction = transDoc.data();
    if (transaction.fine?.paid) return res.status(400).json({ success: false, message: 'Fine already paid' });

    const fineAmount = transaction.fine?.amount || 0;
    const paidAmount = amount || fineAmount;
    const paidAt = new Date().toISOString();

    await transDocRef.update({
      'fine.paid': true,
      'fine.paidAmount': paidAmount,
      'fine.paidAt': paidAt,
      updatedAt: paidAt
    });

    const userInstId = transaction.institutionId || 'default_institution';
    const userDocRef = db.collection('institutions').doc(userInstId).collection('users').doc(transaction.user);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
      const user = userDoc.data();
      await userDocRef.update({
        pendingFines: Math.max(0, (user.pendingFines || 0) - fineAmount),
        totalFinesPaid: (user.totalFinesPaid || 0) + fineAmount,
        updatedAt: new Date().toISOString()
      });
    }

    const bookDoc = await db.collection('institutions').doc(userInstId).collection('books').doc(transaction.book).get();
    const bookTitle = bookDoc.exists ? bookDoc.data().title : 'Book';

    await createNotification(transaction.user, 'Fine Paid', `Fine of ₹${fineAmount} paid for "${bookTitle}"`, 'fine_paid');
    res.json({ success: true, message: 'Fine paid successfully', data: { id: transactionId, _id: transactionId, ...transaction, fine: { ...transaction.fine, paid: true, paidAmount, paidAt } } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all transactions (admin) or user's own
// @route  GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { status, type, bookId, page = 1, limit = 10, userId } = req.query;
    const txCollection = getScopedCollection(req, 'transactions');
    const snapshot = await txCollection.get();
    let transactions = [];
    snapshot.forEach(doc => {
      transactions.push({ id: doc.id, _id: doc.id, ...doc.data() });
    });

    // In-memory filters
    if (req.user.role === 'student' || req.user.role === 'teacher') {
      transactions = transactions.filter(t => t.user === req.user._id);
    } else if (userId) {
      transactions = transactions.filter(t => t.user === userId);
    }

    if (status) {
      transactions = transactions.filter(t => t.status === status);
    }

    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    if (bookId) {
      transactions = transactions.filter(t => t.book === bookId);
    }

    // Sort by createdAt desc in-memory
    transactions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const populated = [];
    for (const t of transactions) {
      const [userDoc, bookDoc] = await Promise.all([
        getScopedDoc(req, 'users', t.user),
        getScopedDoc(req, 'books', t.book)
      ]);

      const userData = userDoc ? userDoc.data() : null;
      const bookData = bookDoc ? bookDoc.data() : null;

      populated.push({
        ...t,
        user: userData ? { id: userDoc.id, _id: userDoc.id, name: userData.name, email: userData.email, studentId: userData.studentId } : null,
        book: bookData ? { id: bookDoc.id, _id: bookDoc.id, title: bookData.title, author: bookData.author, isbn: bookData.isbn, coverImage: bookData.coverImage } : null
      });
    }

    const total = populated.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginated = populated.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginated,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get overdue books
// @route  GET /api/transactions/overdue
exports.getOverdue = async (req, res) => {
  try {
    const nowStr = new Date().toISOString();
    const txCollection = getScopedCollection(req, 'transactions');
    const snapshot = await txCollection
      .where('status', '==', 'active')
      .where('dueDate', '<', nowStr)
      .get();

    const overdue = [];
    for (const doc of snapshot.docs) {
      const t = doc.data();

      const [userDoc, bookDoc] = await Promise.all([
        getScopedDoc(req, 'users', t.user),
        getScopedDoc(req, 'books', t.book)
      ]);

      const userData = userDoc ? userDoc.data() : null;
      const bookData = bookDoc ? bookDoc.data() : null;
      
      const transactionObj = {
        id: doc.id,
        _id: doc.id,
        ...t,
        user: userData ? { id: userDoc.id, _id: userDoc.id, name: userData.name, email: userData.email, studentId: userData.studentId, phone: userData.phone } : null,
        book: bookData ? { id: bookDoc.id, _id: bookDoc.id, title: bookData.title, author: bookData.author, isbn: bookData.isbn } : null
      };

      const calculatedFine = calculateFine(t.dueDate, t.status, t.returnDate);
      overdue.push({
        ...transactionObj,
        calculatedFine
      });
    }

    res.json({ success: true, data: overdue, count: overdue.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Request/Reserve a book
// @route  POST /api/transactions/request
exports.requestBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user._id;

    const userDoc = await getScopedDoc(req, 'users', userId);
    const bookDoc = await getScopedDoc(req, 'books', bookId);

    if (!userDoc) return res.status(404).json({ success: false, message: 'User not found' });
    if (!bookDoc) return res.status(404).json({ success: false, message: 'Book not found' });

    const user = userDoc.data();
    const book = bookDoc.data();

    if ((book.availableCopies || 0) < 1) return res.status(400).json({ success: false, message: 'No copies available to request' });
    if ((user.pendingFines || 0) > 0) return res.status(400).json({ success: false, message: 'Clear pending fines before requesting a book' });

    // Check if user already has this book issued or requested inside their scoped collection
    const txCollection = getScopedCollection(req, 'transactions');
    const existingSnapshot = await txCollection
      .where('user', '==', userId)
      .where('book', '==', bookId)
      .get();

    let alreadyExists = false;
    existingSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'active' || (data.type === 'request' && data.status === 'pending')) {
        alreadyExists = true;
      }
    });

    if (alreadyExists) {
      return res.status(400).json({ success: false, message: 'You already have this book issued or requested' });
    }

    const userInstId = user.institutionId || 'default_institution';
    const transactionData = {
      user: userId,
      book: bookId,
      type: 'request',
      status: 'pending',
      institutionId: userInstId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await txCollection.add(transactionData);
    const transId = docRef.id;

    const transaction = {
      id: transId,
      _id: transId,
      ...transactionData,
      user: { id: userId, _id: userId, name: user.name, studentId: user.studentId },
      book: { id: bookId, _id: bookId, title: book.title, author: book.author, isbn: book.isbn }
    };

    await createNotification(userId, 'Book Requested', `"${book.title}" requested successfully.`, 'book_requested', {
      relatedTransaction: transId, relatedBook: bookId,
    });

    res.status(201).json({ success: true, message: 'Book requested successfully', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Cancel a book request
// @route  DELETE /api/transactions/request/:id
exports.cancelRequest = async (req, res) => {
  try {
    const requestDocRef = await getScopedDocRefAsync(req, 'transactions', req.params.id);
    if (!requestDocRef) return res.status(404).json({ success: false, message: 'Request not found' });
    
    const requestDoc = await requestDocRef.get();
    if (!requestDoc.exists) return res.status(404).json({ success: false, message: 'Request not found' });
    
    const data = requestDoc.data();
    if (data.type !== 'request' || data.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled' });
    }

    if (data.user !== req.user._id && req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await requestDocRef.update({ status: 'cancelled', updatedAt: new Date().toISOString() });
    res.json({ success: true, message: 'Request cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
