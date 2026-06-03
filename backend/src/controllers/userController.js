const { db, auth } = require('../config/firebaseAdmin');
const { getScopedCollection, getScopedDoc, getScopedDocRefAsync } = require('../utils/dbHelper');

// @desc   Get all users
// @route  GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const { search, role, department, year, isActive, page = 1, limit = 10 } = req.query;
    
    // Get scoped collection (either a specific subcollection, or collectionGroup if super_admin with no scope)
    const usersColl = getScopedCollection(req, 'users');
    const snapshot = await usersColl.get();
    let users = [];
    
    snapshot.forEach(doc => {
      users.push({ id: doc.id, _id: doc.id, ...doc.data() });
    });

    // In-memory filters
    if (role) {
      if (role === 'staff') {
        users = users.filter(u => ['teacher', 'librarian', 'admin'].includes(u.role));
      } else {
        users = users.filter(u => u.role === role);
      }
    }
    if (department) {
      users = users.filter(u => u.department === department);
    }
    if (year) {
      users = users.filter(u => u.year === year);
    }
    if (isActive !== undefined) {
      const activeBool = isActive === 'true';
      users = users.filter(u => u.isActive === activeBool);
    }

    // Sort by createdAt desc in-memory
    users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // In-memory text search filtering
    if (search) {
      const term = search.toLowerCase();
      users = users.filter(user => 
        (user.name && user.name.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.studentId && user.studentId.toLowerCase().includes(term))
      );
    }

    const total = users.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedUsers = users.slice(skip, skip + Number(limit));

    res.json({ 
      success: true, 
      data: paginatedUsers, 
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single user
// @route  GET /api/users/:id
exports.getUser = async (req, res) => {
  try {
    const uid = req.params.id;
    const userDoc = await getScopedDoc(req, 'users', uid);
    if (!userDoc) return res.status(404).json({ success: false, message: 'User not found' });
    
    const user = { id: userDoc.id, _id: userDoc.id, ...userDoc.data() };
    const instId = user.institutionId || 'default_institution';
    
    // Get ALL transactions for this user within their institution subcollection
    const transactionsSnapshot = await db.collection('institutions')
      .doc(instId)
      .collection('transactions')
      .where('user', '==', uid)
      .get();
      
    const activeTransactions = [];
    const pastTransactions = [];
    
    for (const doc of transactionsSnapshot.docs) {
      const transData = doc.data();
      // Fetch book detail from the same institution's catalog
      const bookDoc = await db.collection('institutions')
        .doc(instId)
        .collection('books')
        .doc(transData.book)
        .get();
      
      const bookData = bookDoc.exists ? bookDoc.data() : null;
      const populatedTrans = {
        id: doc.id,
        _id: doc.id,
        ...transData,
        book: bookData ? { id: bookDoc.id, _id: bookDoc.id, title: bookData.title, author: bookData.author, isbn: bookData.isbn, coverImage: bookData.coverImage } : null
      };
      
      if (transData.status === 'active') {
        activeTransactions.push(populatedTrans);
      } else {
        pastTransactions.push(populatedTrans);
      }
    }
    
    // Sort past transactions by createdAt desc
    pastTransactions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({ success: true, data: { user, activeTransactions, pastTransactions } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update user (admin)
// @route  PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const uid = req.params.id;
    const userDocRef = await getScopedDocRefAsync(req, 'users', uid);
    if (!userDocRef) return res.status(404).json({ success: false, message: 'User not found' });
    
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, email, role, studentId, department, year, phone, isActive } = req.body;

    if (role && !['student', 'teacher', 'librarian', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    const updates = {
      name,
      role,
      studentId: studentId || '',
      department: department || '',
      year: year || '',
      phone: phone || '',
      updatedAt: new Date().toISOString()
    };

    if (email) {
      updates.email = email.toLowerCase().trim();
    }

    if (isActive !== undefined) {
      updates.isActive = isActive === true || isActive === 'true';
    }

    await userDocRef.update(updates);
    const updatedUser = { id: uid, _id: uid, ...userDoc.data(), ...updates };
    
    res.json({ success: true, message: 'User updated', data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Toggle user active status
// @route  PATCH /api/users/:id/toggle-status
exports.toggleStatus = async (req, res) => {
  try {
    const uid = req.params.id;
    const userDocRef = await getScopedDocRefAsync(req, 'users', uid);
    if (!userDocRef) return res.status(404).json({ success: false, message: 'User not found' });
    
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });

    const newStatus = !userDoc.data().isActive;
    await userDocRef.update({ isActive: newStatus, updatedAt: new Date().toISOString() });
    
    const updatedUser = { id: uid, _id: uid, ...userDoc.data(), isActive: newStatus };
    res.json({ success: true, message: `User ${newStatus ? 'activated' : 'deactivated'}`, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete user
// @route  DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const uid = req.params.id;
    const userDocRef = await getScopedDocRefAsync(req, 'users', uid);
    if (!userDocRef) return res.status(404).json({ success: false, message: 'User not found' });
    
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) return res.status(404).json({ success: false, message: 'User not found' });

    const userData = userDoc.data();
    if (userData.currentlyBorrowed > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete user with active borrows' });
    }

    // Delete Firestore profile
    await userDocRef.delete();
    
    // Also delete from Firebase Auth
    try {
      await auth.deleteUser(uid);
    } catch (authError) {
      console.warn(`Could not delete Auth user ${uid} from Firebase Auth:`, authError.message);
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
