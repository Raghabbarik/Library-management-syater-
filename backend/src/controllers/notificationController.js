const { db } = require('../config/firebaseAdmin');
const { getScopedCollection, getScopedDocRefAsync } = require('../utils/dbHelper');

// @desc   Get notifications for current user
// @route  GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const uid = req.user._id;
    
    const notifCollection = getScopedCollection(req, 'notifications');
    const snapshot = await notifCollection.get();
    let notifications = [];
    let unreadCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.recipient === uid) {
        notifications.push({ id: doc.id, _id: doc.id, ...data });
        if (!data.isRead) {
          unreadCount++;
        }
      }
    });

    if (unreadOnly === 'true') {
      notifications = notifications.filter(n => n.isRead === false);
    }

    // Sort by createdAt desc in-memory
    notifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const total = notifications.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginated = notifications.slice(skip, skip + Number(limit));

    res.json({ success: true, data: paginated, unreadCount, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Mark notification(s) as read
// @route  PATCH /api/notifications/mark-read
exports.markRead = async (req, res) => {
  try {
    const { ids, all } = req.body;
    const uid = req.user._id;
    const notifCollection = getScopedCollection(req, 'notifications');
    const batch = db.batch();

    if (all) {
      const snapshot = await notifCollection
        .where('recipient', '==', uid)
        .where('isRead', '==', false)
        .get();

      snapshot.forEach(doc => {
        batch.update(doc.ref, { isRead: true, readAt: new Date().toISOString() });
      });
    } else if (ids && ids.length) {
      for (const id of ids) {
        const docRef = notifCollection.doc(id);
        const doc = await docRef.get();
        if (doc.exists && doc.data().recipient === uid) {
          batch.update(docRef, { isRead: true, readAt: new Date().toISOString() });
        }
      }
    }

    await batch.commit();
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete a notification
// @route  DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const notifId = req.params.id;
    const uid = req.user._id;
    const docRef = await getScopedDocRefAsync(req, 'notifications', notifId);
    if (!docRef) return res.status(404).json({ success: false, message: 'Notification not found' });

    const doc = await docRef.get();
    if (doc.exists && doc.data().recipient === uid) {
      await docRef.delete();
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
