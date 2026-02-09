/**
 * Booking Controller
 * Handles booking creation, status updates, and viewing
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const validators = require('../utils/validators');
const logger = require('../utils/logger');
const crypto = require('../utils/crypto');
const { getCache, setCache, deleteCachePattern } = require('../utils/redis');

// Show booking form
exports.getBookingForm = async (req, res) => {
  try {
    const { vehicleId } = req.query;
    
    if (!vehicleId) {
      return res.status(400).render('error', {
        title: 'Error',
        message: 'Vehicle ID is required',
        error: { status: 400 },
        user: req.user || null
      });
    }
    
    // Get vehicle details
    const vehicle = await req.prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });
    
    if (!vehicle) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Vehicle not found',
        error: { status: 404 },
        user: req.user || null
      });
    }
    
    if (!vehicle.availability) {
      return res.status(400).render('error', {
        title: 'Not Available',
        message: 'Vehicle is not available for booking',
        error: { status: 400 },
        user: req.user || null
      });
    }
    
    res.render('bookings/form', {
      title: 'Book Vehicle',
      vehicle,
      vehicleId,
      csrfToken: req.session.csrfToken,
      user: req.user || null
    });
  } catch (error) {
    console.error('Get booking form error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error loading booking form',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user || null
    });
  }
};

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { vehicleId, startDate, endDate } = req.body;
    const userId = req.user.id;
    
    // Validate booking data
    const validation = validators.validateBookingData({
      vehicleId,
      startDate,
      endDate
    });
    
    if (!validation.valid) {
      logger.warn('Booking validation failed', {
        userId,
        vehicleId,
        errors: validation.errors
      });
      return res.status(400).json({ 
        success: false, 
        message: validation.errors.join(', ') 
      });
    }
    
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get vehicle details
    const vehicle = await req.prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });
    
    if (!vehicle) {
      logger.warn('Vehicle not found', { vehicleId });
      return res.status(404).json({ 
        success: false, 
        message: 'Vehicle not found' 
      });
    }
    
    if (!vehicle.availability) {
      logger.info('Vehicle unavailable', { vehicleId });
      return res.status(400).json({ 
        success: false, 
        message: 'Vehicle is not available for booking' 
      });
    }
    
    // Check for overlapping bookings
    const overlappingBooking = await req.prisma.booking.findFirst({
      where: {
        vehicleId,
        status: {
          in: ['PENDING', 'CONFIRMED']
        },
        OR: [
          {
            startDate: {
              lte: end
            },
            endDate: {
              gte: start
            }
          }
        ]
      }
    });
    
    if (overlappingBooking) {
      logger.info('Overlapping booking found', {
        vehicleId,
        requestedStart: startDate,
        requestedEnd: endDate
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Vehicle is already booked for the selected dates' 
      });
    }
    
    // Calculate rental duration in days
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    // Calculate total price
    const totalPrice = vehicle.pricePerDay * duration;
    
    // Create booking
    const booking = await req.prisma.booking.create({
      data: {
        userId,
        vehicleId,
        startDate: start,
        endDate: end,
        totalPrice,
        status: 'PENDING'
      }
    });
    
    logger.logBookingCreated(booking.id, userId, vehicleId);
    
    // Invalidate user bookings cache
    await deleteCachePattern(`bookings:user:${userId}`);
    
    // Redirect to payment page or booking summary
    res.status(200).json({ 
      success: true, 
      booking, 
      redirectUrl: `/bookings/${booking.id}/payment` 
    });
  } catch (error) {
    logger.logError('createBooking', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating booking' 
    });
  }
};

// Get booking payment page
exports.getBookingPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await req.prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: true,
        user: true
      }
    });
    
    if (!booking) {
      return res.status(404).render('error', { 
        message: 'Booking not found',
        error: { status: 404 },
        user: req.user || null
      });
    }
    
    if (booking.userId !== req.user.id) {
      return res.status(403).render('error', { 
        message: 'Unauthorized',
        error: { status: 403 },
        user: req.user || null
      });
    }
    
    // Calculate rental duration in days
    const duration = Math.ceil(
      (new Date(booking.endDate) - new Date(booking.startDate)) / 
      (1000 * 60 * 60 * 24)
    );
    
    // Create or retrieve Stripe Payment Intent
    let clientSecret;
    
    if (booking.paymentIntentId) {
      // Retrieve existing payment intent
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
        clientSecret = paymentIntent.client_secret;
      } catch (error) {
        console.error('Error retrieving payment intent:', error);
        // Create new one if retrieval fails
        const paymentIntent = await createPaymentIntent(booking);
        clientSecret = paymentIntent.client_secret;
        
        // Update booking with new payment intent
        await req.prisma.booking.update({
          where: { id },
          data: { paymentIntentId: paymentIntent.id }
        });
      }
    } else {
      // Create new payment intent
      const paymentIntent = await createPaymentIntent(booking);
      clientSecret = paymentIntent.client_secret;
      
      // Update booking with payment intent ID
      await req.prisma.booking.update({
        where: { id },
        data: { paymentIntentId: paymentIntent.id }
      });
    }
    
    res.render('bookings/payment', { 
      title: 'Complete Your Booking',
      booking,
      duration,
      clientSecret,
      stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC_KEY,
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
      csrfToken: req.session.csrfToken,
      user: req.user
    });
  } catch (error) {
    console.error('Get booking payment error:', error);
    res.status(500).render('error', { 
      message: 'Error loading payment page',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user || null
    });
  }
};

// Helper function to create payment intent
async function createPaymentIntent(booking) {
  return await stripe.paymentIntents.create({
    amount: Math.round(booking.totalPrice * 100), // Convert to cents
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      bookingId: booking.id,
      vehicleId: booking.vehicleId,
      userId: booking.userId,
      vehicleName: booking.vehicle.name
    },
    description: `Booking for ${booking.vehicle.name} - ${new Date(booking.startDate).toLocaleDateString()} to ${new Date(booking.endDate).toLocaleDateString()}`
  });
}

// Process booking payment
exports.processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentIntentId } = req.body;
    
    const booking = await req.prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: true,
        user: true
      }
    });
    
    if (!booking) {
      logger.warn('Booking not found for payment', { bookingId: id });
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    if (booking.userId !== req.user.id) {
      logger.warn('Unauthorized payment attempt', {
        bookingId: id,
        userId: req.user.id,
        bookingUserId: booking.userId
      });
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }
    
    try {
      // Retrieve the payment intent to check its status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update booking status to CONFIRMED
        const updatedBooking = await req.prisma.booking.update({
          where: { id },
          data: {
            status: 'CONFIRMED',
            paymentIntentId: paymentIntent.id
          }
        });

        logger.logPaymentProcessed(id, booking.totalPrice, 'succeeded');
        
        // Invalidate user bookings cache
        await deleteCachePattern(`bookings:user:${booking.userId}`);
        await deleteCachePattern('admin:dashboard:*');

        // TODO: Send confirmation email

        return res.status(200).json({ 
          success: true, 
          booking: updatedBooking, 
          redirectUrl: `/bookings/${id}/confirmation`,
          paymentIntentId: paymentIntent.id
        });
      } else if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_payment_method') {
        logger.info('Payment requires action', { bookingId: id, status: paymentIntent.status });
        return res.status(400).json({ 
          success: false, 
          message: 'Payment incomplete. Please try again.',
          status: paymentIntent.status
        });
      } else {
        logger.warn('Payment failed', {
          bookingId: id,
          status: paymentIntent.status
        });
        return res.status(400).json({ 
          success: false, 
          message: `Payment failed with status: ${paymentIntent.status}`
        });
      }
    } catch (stripeError) {
      logger.logPaymentFailed(id, stripeError);
      return res.status(400).json({ 
        success: false, 
        message: stripeError.message || 'Payment processing failed'
      });
    }
  } catch (error) {
    logger.logError('processPayment', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing payment' 
    });
  }
};

// Get booking confirmation page
exports.getBookingConfirmation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await req.prisma.booking.findUnique({
      where: { id },
      include: {
        vehicle: true,
        user: true
      }
    });
    
    if (!booking) {
      return res.status(404).render('error', { 
        message: 'Booking not found',
        error: { status: 404 },
        csrfToken: req.session.csrfToken,
        clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
        user: req.user || null
      });
    }
    
    if (booking.userId !== req.user.id) {
      return res.status(403).render('error', { 
        message: 'Unauthorized',
        error: { status: 403 },
        csrfToken: req.session.csrfToken,
        clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
        user: req.user || null
      });
    }
    
    res.render('bookings/confirmation', { 
      title: 'Booking Confirmation',
      booking,
      csrfToken: req.session.csrfToken,
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
      user: req.user
    });
  } catch (error) {
    console.error('Get booking confirmation error:', error);
    res.status(500).render('error', { 
      message: 'Error loading confirmation page',
      error: req.app.get('env') === 'development' ? error : {},
      csrfToken: req.session.csrfToken,
      clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
      user: req.user || null
    });
  }
};

// Get user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Try to get from cache
    const cacheKey = `bookings:user:${userId}`;
    const cached = await getCache(cacheKey);
    
    let bookings;
    if (cached) {
      bookings = cached;
    } else {
      bookings = await req.prisma.booking.findMany({
        where: { userId },
        include: {
          vehicle: true
        },
        orderBy: {
          startDate: 'desc'
        }
      });
      
      // Cache for 2 minutes
      await setCache(cacheKey, bookings, 120);
    }
    
    // Separate bookings by status
    const currentDate = new Date();
    
    const upcomingBookings = bookings.filter(
      booking => 
        (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && 
        new Date(booking.startDate) > currentDate
    );
    
    const activeBookings = bookings.filter(
      booking => 
        booking.status === 'CONFIRMED' && 
        new Date(booking.startDate) <= currentDate && 
        new Date(booking.endDate) >= currentDate
    );
    
    const pastBookings = bookings.filter(
      booking => 
        booking.status === 'COMPLETED' || 
        (booking.status === 'CONFIRMED' && new Date(booking.endDate) < currentDate)
    );
    
    res.render('user/bookings', { 
      title: 'My Bookings',
      upcomingBookings,
      activeBookings,
      pastBookings,
      user: req.user
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).render('error', { 
      message: 'Error loading bookings',
      error: req.app.get('env') === 'development' ? error : {}
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await req.prisma.booking.findUnique({
      where: { id }
    });
    
    if (!booking) {
      req.flash('error', 'Booking not found');
      return res.redirect('/user/bookings');
    }
    
    if (booking.userId !== req.user.id) {
      req.flash('error', 'You are not authorized to cancel this booking');
      return res.redirect('/user/bookings');
    }
    
    // Only allow cancellation of pending or confirmed bookings
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      req.flash('error', 'Cannot cancel booking with current status');
      return res.redirect('/user/bookings');
    }
    
    // Check if cancellation is allowed (e.g., not too close to start date)
    const startDate = new Date(booking.startDate);
    const currentDate = new Date();
    const daysDifference = Math.ceil((startDate - currentDate) / (1000 * 60 * 60 * 24));
    
    if (daysDifference < 1) {
      req.flash('error', 'Cancellation is not allowed less than 24 hours before start date');
      return res.redirect('/user/bookings');
    }
    
    // Update booking status
    await req.prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });
    
    req.flash('success', 'Booking cancelled successfully');
    res.redirect('/user/bookings');
  } catch (error) {
    console.error('Cancel booking error:', error);
    req.flash('error', 'Error cancelling booking. Please try again.');
    res.redirect('/user/bookings');
  }
};