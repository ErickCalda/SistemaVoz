const express = require('express');
const router = express.Router();
const { 
  getSurveys,
  getSurvey,
  getPublicSurvey,
  getPublicSurveys,
  createSurvey,
  updateSurvey,
  deleteSurvey
} = require('../controllers/surveyController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
// @route   GET /api/surveys/public
// @desc    Get all public active surveys
// @access  Public
router.get('/public', getPublicSurveys);

// @route   GET /api/surveys/public/:id
// @desc    Get public survey by ID
// @access  Public
router.get('/public/:id', getPublicSurvey);

// Authentication required routes
// @route   GET /api/surveys
// @desc    Get all surveys for authenticated user
// @access  Private
router.get('/', verifyToken, getSurveys);

// @route   GET /api/surveys/:id
// @desc    Get survey by ID
// @access  Private
router.get('/:id', verifyToken, getSurvey);

// @route   POST /api/surveys
// @desc    Create a new survey
// @access  Private
router.post('/', verifyToken, createSurvey);

// @route   PUT /api/surveys/:id
// @desc    Update a survey
// @access  Private
router.put('/:id', verifyToken, updateSurvey);

// @route   DELETE /api/surveys/:id
// @desc    Delete a survey
// @access  Private
router.delete('/:id', verifyToken, deleteSurvey);

module.exports = router;
