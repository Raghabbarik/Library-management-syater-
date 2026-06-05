const { db, auth } = require('../config/firebaseAdmin');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    // Verify Firebase ID Token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Step 1: Get institution ID from custom claims (fast path)
    let institutionId = decodedToken.institutionId;

    // Step 2: Fallback — look up root-level /userIndex/{uid} document
    if (!institutionId) {
      const userIndexDoc = await db.collection('userIndex').doc(uid).get();
      if (userIndexDoc.exists) {
        institutionId = userIndexDoc.data().institutionId;
        console.log(`userIndex fallback: uid=${uid} -> institutionId=${institutionId}`);

        // Set custom claims for fast access on future requests
        try {
          await auth.setCustomUserClaims(uid, {
            role: userIndexDoc.data().role,
            institutionId
          });
        } catch (claimErr) {
          console.error(`Failed to set custom claims for ${uid}:`, claimErr.message);
        }
      }
    }

    // Step 3: If still no institutionId, check if this is the register route
    if (!institutionId) {
      if (req.path === '/register' || req.baseUrl + req.path === '/api/auth/register') {
        req.user = { _id: uid, id: uid, email: decodedToken.email };
        return next();
      }
      return res.status(401).json({ success: false, message: 'User profile not found in database' });
    }

    // Step 4: Fetch user profile from scoped subcollection
    const userDoc = await db
      .collection('institutions')
      .doc(institutionId)
      .collection('users')
      .doc(uid)
      .get();

    if (!userDoc.exists) {
      // Allow registration to proceed
      if (req.path === '/register' || req.baseUrl + req.path === '/api/auth/register') {
        req.user = { _id: uid, id: uid, email: decodedToken.email };
        return next();
      }
      return res.status(401).json({ success: false, message: 'User profile not found in database' });
    }

    const userData = userDoc.data();
    req.user = {
      _id: userDoc.id,
      id: userDoc.id,
      ...userData
    };

    if (!req.user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is pending administrator approval or deactivated.' });
    }
    next();
  } catch (error) {
    console.error('Firebase Auth protect middleware error:', error.message);
    if (error.message && error.message.includes('Could not load the default credentials')) {
      return res.status(500).json({
        success: false,
        message: 'Firebase Admin credentials are missing on the server. Please place your "firebase-service-account.json" file inside the "backend/" folder.'
      });
    }
    
    if (error.message && error.message.includes('16 UNAUTHENTICATED')) {
      return res.status(500).json({
        success: false,
        message: 'Backend server authentication failed. The firebase-service-account.json private key might be revoked, expired, or invalid. Please generate a new one from Firebase Console.'
      });
    }

    return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
