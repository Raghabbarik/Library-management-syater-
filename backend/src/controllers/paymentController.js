const { db } = require('../config/firebaseAdmin');

// @desc    Report an orphaned payment issue (payment succeeded, activation failed)
// @route   POST /api/payments/issue
const reportPaymentIssue = async (req, res) => {
  try {
    const { email, phone, planSelected, amount, errorMessage, transactionId } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ success: false, message: 'Email and phone are required for refund processing.' });
    }

    const issue = {
      email: email.toLowerCase().trim(),
      phone,
      planSelected: planSelected || 'unknown',
      amount: amount || 0,
      errorMessage: errorMessage || 'Activation failed after payment.',
      transactionId: transactionId || `txn_${Date.now()}`,
      status: 'pending_refund',
      reportedAt: new Date().toISOString()
    };

    const docRef = await db.collection('paymentIssues').add(issue);

    res.status(201).json({
      success: true,
      message: 'Payment issue reported successfully. Refund will be processed within 5 working days.',
      issue: { id: docRef.id, ...issue }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all payment issues (Super Admin only)
// @route   GET /api/payments/issues
const getPaymentIssues = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view payment issues' });
    }

    const snapshot = await db.collection('paymentIssues').orderBy('reportedAt', 'desc').get();
    let issues = [];
    snapshot.forEach(doc => {
      issues.push({ id: doc.id, _id: doc.id, ...doc.data() });
    });

    res.json({ success: true, data: issues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a payment issue as refunded
// @route   PATCH /api/payments/issues/:id/refund
const markRefunded = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const docRef = db.collection('paymentIssues').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    await docRef.update({
      status: 'refunded',
      refundedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Marked as refunded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Activate subscription for an institution after successful payment
// @route   POST /api/payments/activate
const activateSubscription = async (req, res) => {
  try {
    const uid = req.user._id;
    const { plan, amount, transactionId } = req.body;
    
    // The admin's institution ID is derived from their user profile or token
    const institutionId = req.user.institutionId;
    
    if (!institutionId || institutionId === 'default_institution') {
      return res.status(400).json({ success: false, message: 'Invalid institution for activation.' });
    }

    const instRef = db.collection('institutions').doc(institutionId);
    const instDoc = await instRef.get();
    
    if (!instDoc.exists) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    // Update institution plan and status
    await instRef.update({
      plan: plan || 'free',
      subscriptionStatus: 'active',
      lastPaymentId: transactionId || `txn_${Date.now()}`,
      updatedAt: new Date().toISOString()
    });

    // Also update custom claims if needed, but the frontend will rely on institution profile fetched on login
    res.json({ success: true, message: 'Subscription activated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  reportPaymentIssue,
  getPaymentIssues,
  markRefunded,
  activateSubscription
};
