/**
 * Review Controller
 * Handles creating and managing reviews
 */

const { deleteCachePattern } = require('../utils/redis');

/**
 * Get general review form (shows available bookings to review)
 */
exports.getGeneralReviewForm = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get completed bookings that don't have reviews yet
    const bookings = await req.prisma.booking.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED',
        NOT: {
          reviews: {
            some: {}
          }
        }
      },
      include: {
        vehicle: true
      },
      orderBy: {
        endDate: 'desc'
      }
    });
    
    res.render('reviews/available-bookings', {
      title: 'Leave a Review',
      bookings
    });
  } catch (error) {
    console.error('Error getting general review form:', error);
    res.status(500).render('error', {
      message: 'Failed to load review form',
      error: { status: 500, stack: '' },
      title: 'Error'
    });
  }
};

/**
 * Get review form
 */
exports.getReviewForm = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    
    // Get booking details
    const booking = await req.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vehicle: true
      }
    });
    
    if (!booking) {
      return res.status(404).render('error', { 
        message: 'Booking not found',
        error: { status: 404, stack: '' },
        title: 'Booking Not Found'
      });
    }
    
    // Check if booking belongs to user
    if (booking.userId !== userId) {
      return res.status(403).render('error', { 
        message: 'You can only review your own bookings',
        error: { status: 403, stack: '' },
        title: 'Access Denied'
      });
    }
    
    // Check if booking is completed
    if (booking.status !== 'COMPLETED') {
      return res.status(400).render('error', { 
        message: 'You can only review completed bookings',
        error: { status: 400, stack: '' },
        title: 'Invalid Request'
      });
    }
    
    // Check if user already reviewed this booking
    const existingReview = await req.prisma.review.findFirst({
      where: {
        bookingId,
        userId
      }
    });
    
    if (existingReview) {
      return res.redirect(`/reviews/edit/${existingReview.id}`);
    }
    
    res.render('reviews/form', {
      title: 'Leave a Review',
      booking,
      vehicle: booking.vehicle,
      review: null
    });
  } catch (error) {
    console.error('Get review form error:', error);
    res.status(500).render('error', { 
      message: 'Error loading review form',
      error: req.app.get('env') === 'development' ? error : {},
      title: 'Error'
    });
  }
};

/**
 * Get edit review form
 */
exports.getEditReviewForm = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    
    // Get review details
    const review = await req.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        booking: true,
        vehicle: true
      }
    });
    
    if (!review) {
      return res.status(404).render('error', { 
        message: 'Review not found',
        error: { status: 404, stack: '' },
        title: 'Review Not Found'
      });
    }
    
    // Check if review belongs to user
    if (review.userId !== userId) {
      return res.status(403).render('error', { 
        message: 'You can only edit your own reviews',
        error: { status: 403, stack: '' },
        title: 'Access Denied'
      });
    }
    
    // Check if review is within 7 days for editing
    const reviewDate = new Date(review.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - reviewDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 7) {
      return res.status(400).render('error', { 
        message: 'Reviews can only be edited within 7 days of creation',
        error: { status: 400, stack: '' },
        title: 'Invalid Request'
      });
    }
    
    res.render('reviews/form', {
      title: 'Edit Review',
      booking: review.booking,
      vehicle: review.vehicle,
      review
    });
  } catch (error) {
    console.error('Get edit review form error:', error);
    res.status(500).render('error', { 
      message: 'Error loading edit review form',
      error: req.app.get('env') === 'development' ? error : {},
      title: 'Error'
    });
  }
};

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, title, comment } = req.body;
    const userId = req.user.id;

    // Validate rating
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      req.flash('error', 'Rating must be between 1 and 5');
      return res.redirect(`/reviews/create/${bookingId}`);
    }

    // Get booking details
    const booking = await req.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).render('error', { message: 'Booking not found', error: { status: 404, stack: '' }, title: 'Booking Not Found' });

    // Ensure booking belongs to user
    if (booking.userId !== userId) return res.status(403).render('error', { message: 'You can only review your own bookings', error: { status: 403, stack: '' }, title: 'Access Denied' });

    // Ensure booking is completed
    if (booking.status !== 'COMPLETED') return res.status(400).render('error', { message: 'You can only review completed bookings', error: { status: 400, stack: '' }, title: 'Invalid Request' });

    // Check if user already reviewed this booking
    const existingReview = await req.prisma.review.findFirst({ where: { bookingId, userId } });
    if (existingReview) {
      req.flash('error', 'You have already reviewed this booking');
      return res.redirect(`/reviews/edit/${existingReview.id}`);
    }

    // Create review
    await req.prisma.review.create({
      data: {
        bookingId,
        userId,
        vehicleId: booking.vehicleId,
        rating: ratingNum,
        title,
        comment
      }
    });
    
    // Invalidate vehicle detail cache (includes reviews)
    await deleteCachePattern(`vehicle:detail:${booking.vehicleId}`);
    // Invalidate admin dashboard cache
    await deleteCachePattern('admin:dashboard:*');

    req.flash('success', 'Review submitted successfully');
    res.redirect('/user/reviews');

  } catch (error) {
    console.error('Create review error:', error);
    req.flash('error', 'Error creating review');
    res.redirect('/user/bookings');
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user.id;

    // Validate rating
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      req.flash('error', 'Rating must be between 1 and 5');
      return res.redirect(`/reviews/edit/${id}`);
    }

    // Get the review
    const review = await req.prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).render('error', { message: 'Review not found', error: { status: 404, stack: '' }, title: 'Review Not Found' });

    // Ensure review belongs to user
    if (review.userId !== userId) return res.status(403).render('error', { message: 'You can only edit your own reviews', error: { status: 403, stack: '' }, title: 'Access Denied' });

    // Ensure review is within 7 days
    const reviewDate = new Date(review.createdAt);
    const now = new Date();
    const diffDays = Math.ceil((now - reviewDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 7) return res.status(400).render('error', { message: 'Reviews can only be edited within 7 days of creation', error: { status: 400, stack: '' }, title: 'Invalid Request' });

    // Update review
    await req.prisma.review.update({
      where: { id },
      data: { rating: ratingNum, title, comment }
    });

    req.flash('success', 'Review updated successfully');
    res.redirect('/user/reviews');

  } catch (error) {
    console.error('Update review error:', error);
    req.flash('error', 'Error updating review');
    res.redirect('/user/reviews');
  }
};


// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if review exists and belongs to user
    const review = await req.prisma.review.findUnique({
      where: { id }
    });
    
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }
    
    if (review.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own reviews' 
      });
    }
    
    // Delete review
    await req.prisma.review.delete({
      where: { id }
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Review deleted successfully' 
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting review' 
    });
  }
};

// Get all reviews for a vehicle
exports.getVehicleReviews = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    const reviews = await req.prisma.review.findMany({
      where: { vehicleId },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Calculate average rating
    let avgRating = 0;
    if (reviews.length > 0) {
      avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    }
    
    res.status(200).json({ 
      success: true, 
      reviews, 
      avgRating 
    });
  } catch (error) {
    console.error('Get vehicle reviews error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting reviews' 
    });
  }
};