const { admin, db, auth } = require('../config/firebaseAdmin');
const { generateQRCode } = require('../utils/qrGenerator');

// @desc   Register new user profile
// @route  POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, role, studentId, department, year, phone, institutionId, institutionName } = req.body;
    const uid = req.user._id;

    // Check if profile already exists in Firestore using userIndex
    const userIndexDoc = await db.collection('userIndex').doc(uid).get();
    if (userIndexDoc.exists) {
      return res.status(400).json({ success: false, message: 'Profile already exists' });
    }

    // Generate QR Code for the user
    const qrData = JSON.stringify({ userId: uid, studentId: studentId || '', name });
    const qrCode = await generateQRCode(qrData);

    // Determine role — allow admin for institution registration
    let targetRole = 'student';
    if (role === 'teacher') {
      targetRole = 'teacher';
    } else if (role === 'admin') {
      targetRole = 'admin';
    }

    // If registering as admin, create a new institution
    let assignedInstitutionId = institutionId || 'default_institution';

    if (targetRole === 'admin' && institutionName) {
      const instDocRef = db.collection('institutions').doc();
      const newInstitution = {
        name: institutionName,
        logo: '',
        plan: 'free',
        adminUid: uid,
        adminEmail: email.toLowerCase().trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await instDocRef.set(newInstitution);
      assignedInstitutionId = instDocRef.id;
      console.log(`Created new institution "${institutionName}" with ID: ${assignedInstitutionId}`);
    }

    let avatarUrl = '';
    if (req.file && req.file.path) {
      avatarUrl = req.file.path;
    }

    const userProfile = {
      name,
      email: email.toLowerCase().trim(),
      role: targetRole,
      studentId: studentId || '',
      department: department || '',
      year: year || '',
      phone: phone || '',
      institutionId: assignedInstitutionId,
      avatar: avatarUrl,
      qrCode,
      isActive: true, // All users active instantly
      isVerified: targetRole === 'admin' ? true : false,
      membershipExpiry: null,
      totalBooksIssued: 0,
      currentlyBorrowed: 0,
      totalFinesPaid: 0,
      pendingFines: 0,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const userDocRef = db.collection('institutions').doc(assignedInstitutionId).collection('users').doc(uid);
    await userDocRef.set(userProfile);

    // Create root-level userIndex document for middleware/claims fallback
    await db.collection('userIndex').doc(uid).set({
      institutionId: assignedInstitutionId,
      role: targetRole,
      email: email.toLowerCase().trim()
    });

    // Set custom user claims in Firebase Auth for fast scoped queries
    try {
      await auth.setCustomUserClaims(uid, {
        role: targetRole,
        institutionId: assignedInstitutionId
      });
      console.log(`Set claims on register for ${uid}: role=${targetRole}, inst=${assignedInstitutionId}`);
    } catch (claimErr) {
      console.error(`Failed to set custom claims on register for ${uid}:`, claimErr.message);
    }

    res.status(201).json({
      success: true,
      message: targetRole === 'admin' 
        ? 'Institution registered successfully. Pending Super Admin approval.' 
        : 'Profile registration successful',
      user: { id: uid, ...userProfile },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Login user (Stub: login is performed client-side)
// @route  POST /api/auth/login
exports.login = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Login must be performed client-side via Firebase Client SDK. Send the ID Token in the Authorization header to call API routes.'
  });
};

// @desc   Refresh access token (Stub: handled client-side)
// @route  POST /api/auth/refresh
exports.refresh = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Token refreshing is automatically handled client-side by the Firebase Client SDK.'
  });
};

// @desc   Logout user
// @route  POST /api/auth/logout
exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully from backend profile' });
};

// @desc   Get current user profile
// @route  GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const uid = req.user._id;
    const userInstId = req.user.institutionId || 'default_institution';
    const userDocRef = db.collection('institutions').doc(userInstId).collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    const userData = userDoc.data();
    
    // Generate QR code if missing
    if (!userData.qrCode) {
      console.log('Generating missing QR code on getMe for user:', userData.email);
      const qrData = JSON.stringify({ userId: uid, studentId: userData.studentId, name: userData.name });
      const qrCode = await generateQRCode(qrData);
      userData.qrCode = qrCode;
      await userDocRef.update({ qrCode, updatedAt: new Date().toISOString() });
    }

    // Fetch institution details if user has institutionId
    let institution = null;
    const instId = userData.institutionId || 'default_institution';
    const instDoc = await db.collection('institutions').doc(instId).get();
    if (instDoc.exists) {
      institution = { id: instDoc.id, _id: instDoc.id, ...instDoc.data() };
    }

    res.json({ success: true, user: { id: uid, _id: uid, ...userData, institution } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update profile
// @route  PUT /api/auth/me
exports.updateProfile = async (req, res) => {
  try {
    const uid = req.user._id;
    const { name, phone, department, year } = req.body;
    const userInstId = req.user.institutionId || 'default_institution';
    const userDocRef = db.collection('institutions').doc(userInstId).collection('users').doc(uid);
    
    await userDocRef.update({
      name,
      phone: phone || '',
      department: department || '',
      year: year || '',
      updatedAt: new Date().toISOString()
    });

    const updatedDoc = await userDocRef.get();
    res.json({ success: true, message: 'Profile updated', user: { id: uid, _id: uid, ...updatedDoc.data() } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Change password
// @route  PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Password change should be managed client-side using the Firebase Authentication SDK'
  });
};
