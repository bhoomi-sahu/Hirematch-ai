const express = require('express');
const { getHealth } = require('../controllers/health.controller');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint for HireMatch AI backend and MongoDB connection
 * @access  Public
 */
router.get('/', getHealth);

module.exports = router;
