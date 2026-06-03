const { db, auth } = require('../config/firebaseAdmin');

// @desc   Get system settings (public)
// @route  GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    let institutionId = req.query.institutionId;

    // If not passed in query, check if token is in headers
    if (!institutionId && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
          institutionId = userDoc.data().institutionId;
        }
      } catch (tokenErr) {
        // Token invalid/expired, ignore and fall back
      }
    }

    if (!institutionId) {
      institutionId = 'default_institution';
    }

    const instDoc = await db.collection('institutions').doc(institutionId).get();
    if (!instDoc.exists) {
      // Return default settings if none exist yet
      return res.json({
        success: true,
        data: {
          institutionId: 'default_institution',
          institutionName: 'Smart Library',
          logo: '',
          plan: 'free'
        }
      });
    }

    const data = instDoc.data();
    res.json({
      success: true,
      data: {
        institutionId: instDoc.id,
        institutionName: data.name || 'Smart Library',
        logo: data.logo || '',
        plan: data.plan || 'free'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update system settings (Admin only)
// @route  PUT /api/settings
exports.updateSettings = async (req, res) => {
  try {
    const { institutionName, logo } = req.body;
    const institutionId = req.user.institutionId || 'default_institution';

    const instDocRef = db.collection('institutions').doc(institutionId);
    const instDoc = await instDocRef.get();
    if (!instDoc.exists) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    const updatedData = {
      updatedAt: new Date().toISOString()
    };

    if (institutionName !== undefined) {
      updatedData.name = institutionName;
    }
    if (logo !== undefined) {
      updatedData.logo = logo; // Base64 data URL
    }

    await instDocRef.update(updatedData);
    const freshDoc = await instDocRef.get();
    const data = freshDoc.data();

    res.json({
      success: true,
      message: 'Institution settings updated successfully',
      data: {
        institutionId: freshDoc.id,
        institutionName: data.name,
        logo: data.logo,
        plan: data.plan
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
