const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// @route   POST /api/auth/register
// Only an existing admin can create new accounts (staff or admin)
router.post('/register', protect, restrictTo('admin'), register);

// @route   POST /api/auth/login
router.post('/login', login);

module.exports = router;
