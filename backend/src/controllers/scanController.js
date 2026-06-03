const { db } = require('../config/firebaseAdmin');
const { getIO } = require('../config/socket');
const { getScopedCollection, getScopedDoc } = require('../utils/dbHelper');

// @desc   Scan QR for entry/exit (Desk scanner)
// @route  POST /api/scan
exports.scan = async (req, res) => {
  try {
    const { qrData, type } = req.body; // type: 'entry' | 'exit'
    let parsed;
    try { parsed = JSON.parse(qrData); } catch { return res.status(400).json({ success: false, message: 'Invalid QR data' }); }

    const userDoc = await getScopedDoc(req, 'users', parsed.userId);
    if (!userDoc) return res.status(404).json({ success: false, message: 'User not found' });
    
    const user = userDoc.data();
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });

    // Scope check: Ensure student belongs to the admin's/librarian's institution
    if (req.user.role !== 'super_admin' && user.institutionId !== req.user.institutionId) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Student belongs to another institution.' });
    }

    // Create entry log in Firestore subcollection
    const userInstId = user.institutionId || 'default_institution';
    const logData = {
      user: userDoc.id,
      type: type || 'entry',
      timestamp: new Date().toISOString(),
      scannedBy: req.user._id,
      method: 'qr',
      notes: 'Desk QR Scan',
      institutionId: userInstId
    };

    const docRef = await db.collection('institutions').doc(userInstId).collection('gate_logs').add(logData);
    const logId = docRef.id;

    // Emit live scan event via socket.io
    getIO().to(`admin_room_${userInstId}`).emit('entry_exit_scan', {
      log: { id: logId, _id: logId, ...logData, user: { name: user.name, studentId: user.studentId, avatar: user.avatar } },
    });

    res.json({
      success: true,
      message: `${type === 'exit' ? 'Exit' : 'Entry'} recorded for ${user.name}`,
      user: { name: user.name, studentId: user.studentId, avatar: user.avatar, pendingFines: user.pendingFines },
      log: { id: logId, _id: logId, ...logData }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get entry logs
// @route  GET /api/scan/logs
exports.getLogs = async (req, res) => {
  try {
    const { date, type, search, page = 1, limit = 20 } = req.query;
    const logsColl = getScopedCollection(req, 'gate_logs');
    const snapshot = await logsColl.get();
    let logs = [];
    
    snapshot.forEach(doc => {
      logs.push({ id: doc.id, _id: doc.id, ...doc.data() });
    });

    // In-memory filters
    if (req.user.role === 'student' || req.user.role === 'teacher') {
      logs = logs.filter(log => log.user === req.user._id);
    }

    if (type) {
      logs = logs.filter(log => log.type === type);
    }

    // Sort by timestamp desc in-memory
    logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    // Date filtering (local matching on date string)
    if (date) {
      const targetDateStr = new Date(date).toDateString();
      logs = logs.filter(log => new Date(log.timestamp).toDateString() === targetDateStr);
    }

    // Populate user and filter by search term
    const populatedLogs = [];
    for (const log of logs) {
      const userDoc = await getScopedDoc(req, 'users', log.user);
      if (userDoc) {
        const userData = userDoc.data();
        
        if (req.user.role !== 'student' && search) {
          const term = search.toLowerCase();
          const matchesSearch = 
            (userData.name && userData.name.toLowerCase().includes(term)) ||
            (userData.studentId && userData.studentId.toLowerCase().includes(term));
          
          if (!matchesSearch) continue;
        }

        populatedLogs.push({
          ...log,
          user: {
            id: userDoc.id,
            _id: userDoc.id,
            name: userData.name,
            email: userData.email,
            studentId: userData.studentId,
            avatar: userData.avatar,
            department: userData.department
          }
        });
      } else if (!search) {
        // Profile deleted but log remains
        populatedLogs.push({
          ...log,
          user: { name: 'Unknown Student', email: '', studentId: 'N/A' }
        });
      }
    }

    const total = populatedLogs.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedLogs = populatedLogs.slice(skip, skip + Number(limit));

    res.json({ success: true, data: paginatedLogs, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get today's entry count
// @route  GET /api/scan/today-count
exports.getTodayCount = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);

    const logsColl = getScopedCollection(req, 'gate_logs');
    const snapshot = await logsColl
      .where('timestamp', '>=', start.toISOString())
      .where('timestamp', '<=', end.toISOString())
      .get();

    let entries = 0;
    let exits = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === 'entry') entries++;
      if (data.type === 'exit') exits++;
    });

    res.json({ success: true, data: { entries, exits, currentlyInside: Math.max(0, entries - exits) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Student self-scan Library Gate QR
// @route  POST /api/scan/student-scan
exports.studentScan = async (req, res) => {
  try {
    const { qrData, type } = req.body; // type: 'entry' | 'exit'
    
    // Check if the QR code is the library gate QR
    let isGateQR = false;
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.type === 'library-gate') {
        isGateQR = true;
      }
    } catch {
      if (qrData === 'library-gate' || qrData === 'library-gate-pass') {
        isGateQR = true;
      }
    }

    if (!isGateQR) {
      return res.status(400).json({ success: false, message: 'Invalid Gate QR code. Please scan the official Library Gate QR Code.' });
    }

    const uid = req.user._id;
    const userDoc = await getScopedDoc(req, 'users', uid);
    if (!userDoc) return res.status(404).json({ success: false, message: 'User not found' });
    
    const user = userDoc.data();
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });

    const userInstId = user.institutionId || 'default_institution';

    // Create entry log in Firestore
    const logData = {
      user: uid,
      type: type || 'entry',
      timestamp: new Date().toISOString(),
      scannedBy: uid,
      method: 'qr',
      notes: 'Self-scanned',
      institutionId: userInstId
    };

    const docRef = await db.collection('institutions').doc(userInstId).collection('gate_logs').add(logData);
    const logId = docRef.id;

    // Notify socket rooms
    getIO().to(`admin_room_${userInstId}`).emit('entry_exit_scan', {
      log: { id: logId, _id: logId, ...logData, user: { name: user.name, studentId: user.studentId, avatar: user.avatar } },
    });

    res.json({
      success: true,
      message: `${type === 'exit' ? 'Exit' : 'Entry'} recorded successfully!`,
      log: { id: logId, _id: logId, ...logData }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get list of students currently inside library (entry > exit today)
// @route  GET /api/scan/inside
exports.getCurrentlyInside = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);

    const logsColl = getScopedCollection(req, 'gate_logs');
    const snapshot = await logsColl
      .where('timestamp', '>=', start.toISOString())
      .where('timestamp', '<=', end.toISOString())
      .get();

    // Build per-user entry/exit counts
    const userMap = {};
    snapshot.forEach(doc => {
      const d = doc.data();
      if (!userMap[d.user]) userMap[d.user] = { entries: 0, exits: 0, lastEntry: null };
      if (d.type === 'entry') {
        userMap[d.user].entries++;
        if (!userMap[d.user].lastEntry || d.timestamp > userMap[d.user].lastEntry) {
          userMap[d.user].lastEntry = d.timestamp;
        }
      }
      if (d.type === 'exit') userMap[d.user].exits++;
    });

    // Filter to those with more entries than exits
    const insideIds = Object.keys(userMap).filter(uid => userMap[uid].entries > userMap[uid].exits);

    // Populate user details
    const result = [];
    for (const uid of insideIds) {
      const userDoc = await getScopedDoc(req, 'users', uid);
      if (userDoc) {
        result.push({
          id: uid,
          _id: uid,
          ...userDoc.data(),
          enteredAt: userMap[uid].lastEntry
        });
      }
    }

    res.json({ success: true, data: result, count: result.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get sessions (entry+exit paired per student visit)
// @route  GET /api/scan/sessions
exports.getSessions = async (req, res) => {
  try {
    const { date, search, page = 1, limit = 12 } = req.query;

    const logsColl = getScopedCollection(req, 'gate_logs');
    const snapshot = await logsColl.get();
    let rawLogs = [];
    snapshot.forEach(doc => rawLogs.push({ id: doc.id, _id: doc.id, ...doc.data() }));

    // Restrict students/teachers to their own logs
    if (req.user.role === 'student' || req.user.role === 'teacher') {
      rawLogs = rawLogs.filter(log => log.user === req.user._id);
    }

    // Date filter
    if (date) {
      const targetDateStr = new Date(date).toDateString();
      rawLogs = rawLogs.filter(log => new Date(log.timestamp).toDateString() === targetDateStr);
    }

    // Sort ascending per user to pair entry→exit
    rawLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Group by user
    const userLogsMap = {};
    rawLogs.forEach(log => {
      if (!userLogsMap[log.user]) userLogsMap[log.user] = [];
      userLogsMap[log.user].push(log);
    });

    // Pair each entry with the next exit for each user
    const sessions = [];
    for (const [userId, userLogs] of Object.entries(userLogsMap)) {
      const stack = []; // unmatched entries
      for (const log of userLogs) {
        if (log.type === 'entry') {
          stack.push({ entryLog: log, exitLog: null });
        } else if (log.type === 'exit' && stack.length > 0) {
          const session = stack.pop();
          session.exitLog = log;
          sessions.push(session);
        }
      }
      // Remaining unmatched entries = still inside
      stack.forEach(s => sessions.push(s));
    }

    // Populate user data
    const userCache = {};
    const populatedSessions = [];
    for (const session of sessions) {
      const uid = session.entryLog.user;
      if (!userCache[uid]) {
        const uDoc = await getScopedDoc(req, 'users', uid);
        userCache[uid] = uDoc ? { id: uid, _id: uid, ...uDoc.data() } : { name: 'Unknown', studentId: 'N/A', department: '' };
      }
      const userData = userCache[uid];

      // Search filter
      if (search) {
        const term = search.toLowerCase();
        const match = (userData.name && userData.name.toLowerCase().includes(term)) ||
                      (userData.studentId && userData.studentId.toLowerCase().includes(term));
        if (!match) continue;
      }

      const entryTime = session.entryLog.timestamp;
      const exitTime  = session.exitLog ? session.exitLog.timestamp : null;
      const durationMs = exitTime ? new Date(exitTime) - new Date(entryTime) : null;

      populatedSessions.push({
        _id: session.entryLog._id,
        user: userData,
        entryTime,
        exitTime,
        durationMs,
        method: session.entryLog.notes === 'Self-scanned' ? 'Self QR Scan' : 'Desk Scan',
        stillInside: !exitTime,
      });
    }

    // Sort by entryTime descending (most recent first)
    populatedSessions.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));

    const total = populatedSessions.length;
    const skip  = (Number(page) - 1) * Number(limit);
    const paginated = populatedSessions.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginated,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Log exit for a specific user by admin button (no QR scan needed)
// @route  POST /api/scan/exit/:userId
exports.exitUser = async (req, res) => {
  try {
    const uid = req.params.userId;
    const userDoc = await getScopedDoc(req, 'users', uid);
    if (!userDoc) return res.status(404).json({ success: false, message: 'User not found' });

    const user = userDoc.data();
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });

    // Scope check: Ensure student belongs to the admin's/librarian's institution
    if (req.user.role !== 'super_admin' && user.institutionId !== req.user.institutionId) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Student belongs to another institution.' });
    }

    const userInstId = user.institutionId || 'default_institution';
    const logData = {
      user: uid,
      type: 'exit',
      timestamp: new Date().toISOString(),
      scannedBy: req.user._id,
      method: 'manual',
      notes: 'Admin exit button',
      institutionId: userInstId
    };

    const docRef = await db.collection('institutions').doc(userInstId).collection('gate_logs').add(logData);
    const logId = docRef.id;

    getIO().to(`admin_room_${userInstId}`).emit('entry_exit_scan', {
      log: { id: logId, _id: logId, ...logData, user: { name: user.name, studentId: user.studentId, avatar: user.avatar } }
    });

    res.json({
      success: true,
      message: `Exit recorded for ${user.name}`,
      user: { name: user.name, studentId: user.studentId },
      log: { id: logId, _id: logId, ...logData }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
