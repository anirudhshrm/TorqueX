/**
 * User Controller
 * Handles user dashboard and profile
 */

const crypto = require('../utils/crypto');
const logger = require('../utils/logger');

// Get user dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user details
    const user = await req.prisma.user.findUnique({
      where: { id: userId }
    });
    
    // Get upcoming bookings
    const upcomingBookings = await req.prisma.booking.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
        startDate: {
          gte: new Date()
        }
      },
      include: {
        vehicle: true
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 5
    });
    
    // Get past bookings
    const pastBookings = await req.prisma.booking.findMany({
      where: {
        userId,
        status: 'COMPLETED'
      },
      include: {
        vehicle: true
      },
      orderBy: {
        endDate: 'desc'
      },
      take: 5
    });
    
    // Get recent broadcasts
    const broadcasts = await req.prisma.broadcast.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });
    
    // Get user reviews
    const reviews = await req.prisma.review.findMany({
      where: {
        userId
      },
      include: {
        vehicle: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });
    
    // Get recommended vehicles based on user preferences
    const recommendedVehicles = await req.prisma.vehicle.findMany({
      where: {
        availability: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });
    
    res.render('user/dashboard', { 
      title: 'My Dashboard',
      user,
      upcomingBookings,
      pastBookings,
      reviews,
      recommendedVehicles,
      broadcasts,
      successMessage: req.flash('success'),
      errorMessage: req.flash('error')
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error loading dashboard',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user || null
    });
  }
};

// Get user bookings
exports.getBookings = async (req, res) => {
  try {
    console.log('getBookings called for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      console.error('No user found in request');
      return res.status(401).render('error', { 
        title: 'Error',
        message: 'User not authenticated',
        error: {},
        user: null
      });
    }
    
    const userId = req.user.id;
    console.log('Fetching bookings for userId:', userId);
    
    // Get all user bookings
    const bookings = await req.prisma.booking.findMany({
      where: {
        userId
      },
      include: {
        vehicle: true
      },
      orderBy: {
        id: 'desc' // Use id instead of createdAt for ordering
      }
    });
    
    console.log('Found bookings:', bookings.length);
    
    // Separate bookings by status
    const upcomingBookings = bookings.filter(booking => 
      booking.status === 'CONFIRMED' && new Date(booking.startDate) >= new Date()
    );
    
    const pendingBookings = bookings.filter(booking => 
      booking.status === 'PENDING'
    );
    
    const pastBookings = bookings.filter(booking => 
      booking.status === 'COMPLETED' || (booking.status === 'CONFIRMED' && new Date(booking.endDate) < new Date())
    );
    
    const cancelledBookings = bookings.filter(booking => 
      booking.status === 'CANCELLED'
    );
    
    res.render('user/bookings', { 
      title: 'My Bookings',
      user: req.user,
      bookings,
      upcomingBookings,
      pendingBookings,
      pastBookings,
      cancelledBookings,
      successMessage: req.flash('success'),
      errorMessage: req.flash('error')
    });
  } catch (error) {
    console.error('User bookings error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error loading bookings',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user || null
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user details
    const user = await req.prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).render('error', { 
        title: 'Error',
        message: 'User not found',
        error: {},
        user: req.user || null
      });
    }
    
    // Decrypt sensitive fields for display - handle errors gracefully
    const decryptedUser = {
      ...user,
      phone: null,
      address: null
    };
    
    // Try to decrypt phone if it exists
    if (user.phone) {
      try {
        decryptedUser.phone = crypto.decryptField(user.phone);
      } catch (error) {
        logger.warn('Failed to decrypt phone field', { userId, error: error.message });
        // Leave as null or show the original if it's plain text
        decryptedUser.phone = null;
      }
    }
    
    // Try to decrypt address if it exists
    if (user.address) {
      try {
        decryptedUser.address = crypto.decryptField(user.address);
      } catch (error) {
        logger.warn('Failed to decrypt address field', { userId, error: error.message });
        // Leave as null or show the original if it's plain text
        decryptedUser.address = null;
      }
    }
    
    res.render('user/profile', { 
      title: 'My Profile',
      user: decryptedUser,
      successMessage: req.flash('success'),
      errorMessage: req.flash('error')
    });
  } catch (error) {
    logger.error('Profile retrieval failed', { error: error.message, stack: error.stack });
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error loading profile',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user || null
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address } = req.body;
    
    logger.info('User profile update initiated', { userId });
    
    // Encrypt sensitive fields
    const encryptedPhone = phone ? crypto.encryptField(phone) : null;
    const encryptedAddress = address ? crypto.encryptField(address) : null;
    
    // Update user details with encrypted sensitive data
    const updatedUser = await req.prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone: encryptedPhone,
        address: encryptedAddress
      }
    });
    
    logger.info('User profile updated successfully', { 
      userId,
      fields: ['name', 'phone', 'address']
    });
    
    req.flash('success', 'Profile updated successfully');
    res.redirect('/user/profile');
  } catch (error) {
    logger.error('Profile update failed', { error: error.message });
    req.flash('error', 'Failed to update profile');
    res.redirect('/user/profile');
  }
};

// Get user profile with decrypted data
exports.getProfileDecrypted = async (userId) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) return null;
    
    // Decrypt sensitive fields for display
    return {
      ...user,
      phone: user.phone ? crypto.decryptField(user.phone) : null,
      address: user.address ? crypto.decryptField(user.address) : null
    };
  } catch (error) {
    logger.error('Profile decryption failed', { error: error.message });
    return null;
  }
};

// Get user reviews
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user reviews
    const reviews = await req.prisma.review.findMany({
      where: {
        userId
      },
      include: {
        vehicle: true,
        booking: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.render('user/reviews', {
      title: 'My Reviews',
      reviews,
      user: req.user,
      successMessage: req.flash('success'),
      errorMessage: req.flash('error')
    });
  } catch (error) {
    console.error('User reviews error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error loading reviews',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user || null
    });
  }
};

// Get all broadcasts
exports.getBroadcasts = async (req, res) => {
  try {
    // Get all broadcasts
    const broadcasts = await req.prisma.broadcast.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.render('user/broadcasts', { 
      title: 'Announcements',
      user: req.user,
      broadcasts,
      successMessage: req.flash('success'),
      errorMessage: req.flash('error')
    });
  } catch (error) {
    console.error('Broadcasts error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error loading announcements',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user || null
    });
  }
};