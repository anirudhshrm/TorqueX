const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// Login page
router.get('/login', authController.getLoginPage);
router.post('/login', authController.handleAuthCallback); // Handle login form submission

// Signup page
router.get('/signup', authController.getSignupPage);
router.post('/signup', authController.handleAuthCallback); // Handle signup form submission

// Logout
router.get('/logout', requireAuth, authController.logout);

// Auth callback
router.get('/callback', authController.handleAuthCallback);
router.post('/callback', authController.handleAuthCallback);

module.exports = router;