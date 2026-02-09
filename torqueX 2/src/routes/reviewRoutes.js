const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/authMiddleware');

// Get all reviews (public)
router.get('/', (req, res) => {
  res.render('reviews/list', { 
    title: 'Vehicle Reviews',
    reviews: [],
    message: 'Reviews will be displayed here'
  });
});

// Get general review form (shows available bookings)
router.get('/form', requireAuth, reviewController.getGeneralReviewForm);

// Get review form
router.get('/create/:bookingId', requireAuth, reviewController.getReviewForm);

// Get edit review form
router.get('/edit/:reviewId', requireAuth, reviewController.getEditReviewForm);

// Create a review
router.post('/', requireAuth, reviewController.createReview);

// Update a review
router.put('/:id', requireAuth, reviewController.updateReview);
router.post('/:id', requireAuth, reviewController.updateReview); // Support form submissions

// Delete a review
router.delete('/:id', requireAuth, reviewController.deleteReview);

// Get all reviews for a vehicle
router.get('/vehicle/:vehicleId', reviewController.getVehicleReviews);

module.exports = router;