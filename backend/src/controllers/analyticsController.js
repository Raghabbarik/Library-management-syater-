const { db } = require('../config/firebaseAdmin');
const { getScopedCollection } = require('../utils/dbHelper');

// @desc   Get dashboard analytics summary
// @route  GET /api/analytics/summary
exports.getSummary = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();
    const nowStr = new Date().toISOString();

    // Fetch active books count scoped to institution
    const booksColl = getScopedCollection(req, 'books');
    const booksSnapshot = await booksColl.where('isActive', '==', true).get();
    const totalBooks = booksSnapshot.size;

    // Fetch active students count scoped to institution
    const usersColl = getScopedCollection(req, 'users');
    const usersSnapshot = await usersColl
      .where('role', '==', 'student')
      .where('isActive', '==', true)
      .get();
    
    const totalUsers = usersSnapshot.size;
    let totalFinesPending = 0;
    usersSnapshot.forEach(doc => {
      totalFinesPending += (doc.data().pendingFines || 0);
    });

    // Fetch transactions metrics scoped to institution
    const txColl = getScopedCollection(req, 'transactions');
    const transSnapshot = await txColl.get();
    let activeTransactions = 0;
    let overdueCount = 0;
    let todayIssued = 0;
    let todayReturned = 0;

    transSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'active') {
        activeTransactions++;
        if (data.dueDate && data.dueDate < nowStr) {
          overdueCount++;
        }
      }

      if (data.type === 'issue' && data.createdAt && data.createdAt >= todayStr) {
        todayIssued++;
      }

      if (data.status === 'returned' && data.updatedAt && data.updatedAt >= todayStr) {
        todayReturned++;
      }
    });

    // Fetch today's entry logs scoped to institution
    const logsColl = getScopedCollection(req, 'gate_logs');
    const allLogsSnap = await logsColl.get();
    let todayEntries = 0;
    allLogsSnap.forEach(doc => {
      const d = doc.data();
      if (d.type === 'entry' && d.timestamp && d.timestamp >= todayStr) todayEntries++;
    });

    res.json({
      success: true,
      data: {
        totalBooks,
        totalUsers,
        activeTransactions,
        overdueCount,
        todayIssued,
        todayReturned,
        totalFinesPending,
        todayEntries
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get issue/return trend (last 7 days)
// @route  GET /api/analytics/trend
exports.getTrend = async (req, res) => {
  try {
    const days = 7;
    const result = [];
    
    // Fetch scoped transactions
    const txColl = getScopedCollection(req, 'transactions');
    const snapshot = await txColl.get();
    const transactions = [];
    snapshot.forEach(doc => {
      transactions.push(doc.data());
    });

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dateStr = date.toISOString().split('T')[0];
      const startStr = date.toISOString();
      const endStr = nextDate.toISOString();

      const issued = transactions.filter(t => t.type === 'issue' && t.createdAt >= startStr && t.createdAt < endStr).length;
      const returned = transactions.filter(t => t.status === 'returned' && t.updatedAt >= startStr && t.updatedAt < endStr).length;

      result.push({ date: dateStr, issued, returned });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get top issued books
// @route  GET /api/analytics/top-books
exports.getTopBooks = async (req, res) => {
  try {
    // Fetch scoped active books
    const booksColl = getScopedCollection(req, 'books');
    const snapshot = await booksColl.where('isActive', '==', true).get();

    const books = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      books.push({
        id: doc.id,
        _id: doc.id,
        title: data.title,
        author: data.author,
        totalIssued: data.totalIssued || 0,
        coverImage: data.coverImage || '',
        category: data.category || ''
      });
    });

    // Sort in-memory by totalIssued descending
    books.sort((a, b) => b.totalIssued - a.totalIssued);
    const top10 = books.slice(0, 10);

    res.json({ success: true, data: top10 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get category distribution
// @route  GET /api/analytics/categories
exports.getCategoryDistribution = async (req, res) => {
  try {
    const booksColl = getScopedCollection(req, 'books');
    const snapshot = await booksColl.where('isActive', '==', true).get();
    const categoryMap = {};

    snapshot.forEach(doc => {
      const data = doc.data();
      const cat = data.category || 'General';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { _id: cat, count: 0, totalCopies: 0, available: 0 };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].totalCopies += (Number(data.totalCopies) || 0);
      categoryMap[cat].available += (Number(data.availableCopies) || 0);
    });

    const data = Object.values(categoryMap).sort((a, b) => b.count - a.count);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
