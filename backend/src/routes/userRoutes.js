const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUser, toggleStatus, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/', protect, authorize('admin', 'librarian'), getUsers);
router.get('/:id', protect, authorize('admin', 'librarian'), getUser);
router.put('/:id', protect, authorize('admin'), updateUser);
router.patch('/:id/toggle-status', protect, authorize('admin'), toggleStatus);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
