const express = require('express');
const router = express.Router();
const { 
  getInstitutions, 
  createInstitution, 
  updateInstitution, 
  deleteInstitution 
} = require('../controllers/institutionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public route to fetch institutions for registration/landing selectors
router.get('/', getInstitutions);

// Protected: Super Admin only
router.post('/', protect, authorize('super_admin'), createInstitution);
router.delete('/:id', protect, authorize('super_admin'), deleteInstitution);

// Protected: Admin or Super Admin
router.put('/:id', protect, authorize('admin', 'super_admin'), updateInstitution);

module.exports = router;
