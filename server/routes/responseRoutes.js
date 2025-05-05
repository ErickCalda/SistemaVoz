const express = require('express');
const router = express.Router();
const { 
  createResponse,
  getResponses,
  getResponseById,
  getSurveyResponses,
  deleteResponse
} = require('../controllers/responseController');
const { verifyToken } = require('../middleware/authMiddleware');

// @route   POST /api/responses
// @desc    Submit a survey response
// @access  Public
router.post('/', createResponse);

// @route   GET /api/responses
// @desc    Get all responses (admin only)
// @access  Private
router.get('/', verifyToken, getResponses);

// @route   GET /api/responses/:id
// @desc    Get response by ID
// @access  Private
router.get('/:id', verifyToken, getResponseById);

// @route   GET /api/responses/survey/:surveyId
// @desc    Get all responses for a survey
// @access  Private
router.get('/survey/:surveyId', verifyToken, getSurveyResponses);

// @route   DELETE /api/responses/:id
// @desc    Delete a response
// @access  Private
router.delete('/:id', verifyToken, deleteResponse);

module.exports = router;
