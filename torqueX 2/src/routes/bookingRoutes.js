const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { requireAuth } = require('../middleware/authMiddleware');

// Show booking form
router.get('/create', requireAuth, bookingController.getBookingForm);

// Create a new booking
router.post('/', requireAuth, bookingController.createBooking);

// Get booking payment page
router.get('/:id/payment', requireAuth, bookingController.getBookingPayment);

// Process booking payment
router.post('/:id/payment', requireAuth, bookingController.processPayment);

// Get booking confirmation page
router.get('/:id/confirmation', requireAuth, bookingController.getBookingConfirmation);

// Get user bookings
router.get('/', requireAuth, bookingController.getUserBookings);

// Cancel booking
router.post('/:id/cancel', requireAuth, bookingController.cancelBooking);

module.exports = router;