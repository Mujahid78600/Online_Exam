const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserStatus } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);

module.exports = router;