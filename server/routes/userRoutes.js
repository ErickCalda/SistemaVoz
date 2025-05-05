const express = require('express');
const router = express.Router();
const { 
  createUser,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// @route   POST /api/users
// @desc    Create or update user
// @access  Private
router.post('/', verifyToken, createUser);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', verifyToken, getUserProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', verifyToken, updateUserProfile);

module.exports = router;
