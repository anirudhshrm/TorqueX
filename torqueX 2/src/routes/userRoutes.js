const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');

// All user routes require authentication
router.use(requireAuth);

// User dashboard
router.get('/dashboard', userController.getDashboard);

// User bookings
router.get('/bookings', userController.getBookings);

// User reviews
router.get('/reviews', userController.getUserReviews);

// User broadcasts
router.get('/broadcasts', userController.getBroadcasts);

// User profile
router.get('/profile', userController.getProfile);

// Update profile
router.post('/profile', userController.updateProfile);

module.exports = router;