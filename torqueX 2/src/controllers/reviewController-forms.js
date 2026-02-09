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