const { db } = require('../config/firebaseAdmin');

// @desc   Get all institutions (public - for registration dropdown)
// @route  GET /api/institutions
exports.getInstitutions = async (req, res) => {
  try {
    const snapshot = await db.collection('institutions').get();
    const list = [];
    snapshot.forEach(doc => {
      list.push({ id: doc.id, _id: doc.id, ...doc.data() });
    });

    // If empty, return a default institution
    if (list.length === 0) {
      const defaultInst = {
        name: 'Smart Library',
        logo: '',
        plan: 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.collection('institutions').doc('default_institution').set(defaultInst);
      list.push({ id: 'default_institution', _id: 'default_institution', ...defaultInst });
    }

    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Create new institution (Super Admin only)
// @route  POST /api/institutions
exports.createInstitution = async (req, res) => {
  try {
    const { name, logo, plan } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Institution name is required' });
    }

    // Slugify name for doc ID
    const docId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const newInst = {
      name,
      logo: logo || '',
      plan: plan || 'free', // 'free' | 'scholar_elite' | 'pro'
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('institutions').doc(docId).set(newInst);

    res.status(201).json({
      success: true,
      message: 'Institution created successfully',
      data: { id: docId, _id: docId, ...newInst }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update institution (Super Admin or local Admin for logo/name)
// @route  PUT /api/institutions/:id
exports.updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo, plan } = req.body;
    
    // Check if updating plan (only Super Admin can update plan)
    if (plan !== undefined && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only Super Admin can update plans' });
    }

    // Local admin can only update their own institution
    if (req.user.role !== 'super_admin' && req.user.institutionId !== id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this institution' });
    }

    const instDocRef = db.collection('institutions').doc(id);
    const instDoc = await instDocRef.get();
    if (!instDoc.exists) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    const updatedData = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) updatedData.name = name;
    if (logo !== undefined) updatedData.logo = logo;
    if (plan !== undefined) updatedData.plan = plan;

    await instDocRef.update(updatedData);
    const freshDoc = await instDocRef.get();

    res.json({
      success: true,
      message: 'Institution updated successfully',
      data: { id, _id: id, ...freshDoc.data() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete institution (Super Admin only)
// @route  DELETE /api/institutions/:id
exports.deleteInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'default_institution') {
      return res.status(400).json({ success: false, message: 'Cannot delete the default institution' });
    }

    const instDocRef = db.collection('institutions').doc(id);
    const instDoc = await instDocRef.get();
    if (!instDoc.exists) {
      return res.status(404).json({ success: false, message: 'Institution not found' });
    }

    await instDocRef.delete();
    res.json({ success: true, message: 'Institution deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
