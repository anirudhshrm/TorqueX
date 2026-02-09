const { PrismaClient } = require('@prisma/client');
const { deleteCachePattern, getRedisClient, getCache, setCache } = require('../utils/redis');

// Dashboard
exports.getDashboard = async (req, res) => {
  try {
    console.log('Loading admin dashboard for user:', req.user?.email);
    console.log('Request user object:', req.user);
    console.log('Prisma available:', !!req.prisma);
    
    // Check if req.prisma exists
    if (!req.prisma) {
      console.error('Prisma client not found on request object');
      return res.status(500).render('error', { 
        title: 'Error',
        message: 'Database connection error',
        error: { message: 'Prisma client not initialized' },
        user: req.user || null
      });
    }
    
    // Skip cache for now to debug
    console.log('Skipping cache, fetching fresh data...');
    
    console.log('Fetching dashboard data...');
    
    // Get basic stats with error handling
    let userCount = 0;
    let vehicleCount = 0;
    let totalBookingsCount = 0;
    let vehicleTypes = [];
    let recentBookings = [];
    let recentReviews = [];
    let popularVehicles = [];
    let recentVehicleRequests = [];
    let totalRevenue = null;
    
    try {
      // Get user count
      userCount = await req.prisma.user.count({
        where: { role: 'USER' }
      });
      console.log('User count:', userCount);
    } catch (error) {
      console.error('Error fetching user count:', error.message);
    }
    
    try {
      // Get vehicle count
      vehicleCount = await req.prisma.vehicle.count();
      console.log('Vehicle count:', vehicleCount);
    } catch (error) {
      console.error('Error fetching vehicle count:', error.message);
    }
    
    try {
      // Get vehicle types stats
      vehicleTypes = await req.prisma.vehicle.groupBy({
        by: ['type'],
        _count: true
      });
      console.log('Vehicle types:', vehicleTypes.length);
    } catch (error) {
      console.error('Error fetching vehicle types:', error.message);
    }
    
    try {
      // Get total bookings count
      totalBookingsCount = await req.prisma.booking.count();
      console.log('Total bookings:', totalBookingsCount);
    } catch (error) {
      console.error('Error fetching bookings count:', error.message);
    }
    
    try {
      // Get recent bookings
      recentBookings = await req.prisma.booking.findMany({
        take: 5,
        orderBy: {
          id: 'desc' // Use id instead of startDate for safer ordering
        },
        include: {
          vehicle: {
            select: {
              id: true,
              name: true,
              type: true,
              pricePerDay: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      console.log('Recent bookings:', recentBookings.length);
    } catch (error) {
      console.error('Error fetching recent bookings:', error.message);
    }
    
    try {
      // Get recent reviews
      recentReviews = await req.prisma.review.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          vehicle: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      console.log('Recent reviews:', recentReviews.length);
    } catch (error) {
      console.error('Error fetching recent reviews:', error.message);
    }
    
    try {
      // Get popular vehicles
      popularVehicles = await req.prisma.vehicle.findMany({
        take: 5,
        include: {
          _count: {
            select: { bookings: true }
          }
        }
      });
      console.log('Popular vehicles:', popularVehicles.length);
    } catch (error) {
      console.error('Error fetching popular vehicles:', error.message);
    }
    
    try {
      // Get recent vehicle requests
      recentVehicleRequests = await req.prisma.vehicleRequest.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      console.log('Recent vehicle requests:', recentVehicleRequests.length);
    } catch (vehicleRequestError) {
      console.log('Vehicle requests table may not exist:', vehicleRequestError.message);
      // Continue without vehicle requests data
    }
    
    try {
      // Calculate total revenue
      totalRevenue = await req.prisma.booking.aggregate({
        _sum: {
          totalPrice: true
        }
      });
      console.log('Total revenue calculated');
    } catch (error) {
      console.error('Error calculating revenue:', error.message);
    }
    
    // Calculate stats safely
    const vehicleStats = vehicleTypes.map(vt => ({
      type: vt.type,
      count: vt._count
    }));
    
    // Get booking status counts safely
    let pendingBookingsCount = 0;
    let confirmedBookingsCount = 0;
    let completedBookingsCount = 0;
    let cancelledBookingsCount = 0;
    
    try {
      const bookingStatusCounts = await Promise.allSettled([
        req.prisma.booking.count({ where: { status: 'PENDING' } }),
        req.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
        req.prisma.booking.count({ where: { status: 'COMPLETED' } }),
        req.prisma.booking.count({ where: { status: 'CANCELLED' } })
      ]);
      
      pendingBookingsCount = bookingStatusCounts[0].status === 'fulfilled' ? bookingStatusCounts[0].value : 0;
      confirmedBookingsCount = bookingStatusCounts[1].status === 'fulfilled' ? bookingStatusCounts[1].value : 0;
      completedBookingsCount = bookingStatusCounts[2].status === 'fulfilled' ? bookingStatusCounts[2].value : 0;
      cancelledBookingsCount = bookingStatusCounts[3].status === 'fulfilled' ? bookingStatusCounts[3].value : 0;
      
      console.log('Booking status counts fetched successfully');
    } catch (error) {
      console.error('Error fetching booking status counts:', error.message);
    }
    
    // Combine pending and confirmed for "active" bookings
    const activeBookingsCount = pendingBookingsCount + confirmedBookingsCount;

    // Get today's bookings count (bookings starting today)
    let todayBookingsCount = 0;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      todayBookingsCount = await req.prisma.booking.count({
        where: {
          startDate: {
            gte: today,
            lt: tomorrow
          }
        }
      });
      console.log('Today bookings:', todayBookingsCount);
    } catch (error) {
      console.error('Error fetching today bookings:', error.message);
    }

    // Get Redis status safely
    const redisClient = getRedisClient();
    let redisStatus = {
      connected: false,
      status: 'disconnected',
      ping: null,
      error: null,
      cacheKeys: [],
      totalKeys: 0
    };

    try {
      if (redisClient) {
        redisStatus.connected = redisClient.isReady;
        redisStatus.status = redisClient.isReady ? 'connected' : 'disconnected';
        if (redisClient.isReady) {
          redisStatus.ping = await redisClient.ping();
          
          // Get all cache keys
          const allKeys = await redisClient.keys('*');
          redisStatus.totalKeys = allKeys.length;
          
          // Get detailed info about cache keys
          const cacheInfo = [];
          const patterns = {
            'vehicles:': { name: 'Vehicles', color: 'green' },
            'deals:': { name: 'Deals', color: 'blue' },
            'user:': { name: 'User Bookings', color: 'purple' },
            'broadcasts:': { name: 'Broadcasts', color: 'yellow' },
            'sess:': { name: 'Sessions', color: 'gray' }
          };
          
          for (const [pattern, info] of Object.entries(patterns)) {
            const keys = allKeys.filter(k => k.startsWith(pattern));
            if (keys.length > 0) {
              cacheInfo.push({
                name: info.name,
                count: keys.length,
                color: info.color,
                keys: keys.slice(0, 3) // Show first 3 keys as examples
              });
            }
          }
          
          redisStatus.cacheKeys = cacheInfo;
        }
      }
    } catch (error) {
      redisStatus.error = error.message;
      console.error('Redis status check error:', error.message);
    }

    // Format the dashboard data with nested structure matching the EJS template
    const dashboardData = {
      title: 'Admin Dashboard',
      stats: {
        users: userCount,
        totalUsers: userCount,
        vehicles: vehicleCount,
        activeBookings: activeBookingsCount,
        totalBookings: totalBookingsCount,
        pendingBookings: pendingBookingsCount,
        confirmedBookings: confirmedBookingsCount,
        completedBookings: completedBookingsCount,
        cancelledBookings: cancelledBookingsCount,
        // Nested booking stats for EJS template
        bookingStats: {
          active: activeBookingsCount,
          today: todayBookingsCount,
          totalRevenue: totalRevenue && totalRevenue._sum ? totalRevenue._sum.totalPrice || 0 : 0
        },
        // Nested user stats for EJS template
        userStats: {
          total: userCount,
          active: userCount // Assuming all users are active for now
        },
        // Vehicle stats with nested structure
        vehicleStats: {
          total: vehicleCount,
          available: vehicleCount || 0,
          unavailable: 0,
          byType: vehicleStats || []
        },
        vehicleRequestStats: {
          pending: 0 // Simplified for now
        },
        newUsers: userCount || 0,
        growthRate: 0,
        monthlyRevenue: totalRevenue && totalRevenue._sum ? totalRevenue._sum.totalPrice || 0 : 0
      },
      recentBookings: recentBookings || [],
      recentReviews: recentReviews || [],
      popularVehicles: popularVehicles || [],
      recentVehicleRequests: recentVehicleRequests || [],
      requestStats: [],
      revenue: totalRevenue && totalRevenue._sum ? totalRevenue._sum.totalPrice || 0 : 0
    };
    
    console.log('Dashboard data prepared successfully');
    
    res.render('admin/dashboard', {
      ...dashboardData,
      redisStatus,
      user: req.user
    });
  } catch (error) {
    console.error('=== ADMIN DASHBOARD ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    console.error('============================');
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error loading admin dashboard',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user || null
    });
  }
};

// Stats page
exports.getStats = async (req, res) => {
  try {
    // Get comprehensive stats for the stats page
    const [
      userCount,
      vehicleCount,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      reviewsCount
    ] = await Promise.all([
      req.prisma.user.count({ where: { role: 'USER' } }),
      req.prisma.vehicle.count(),
      req.prisma.booking.count(),
      req.prisma.booking.count({ where: { status: 'PENDING' } }),
      req.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      req.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      req.prisma.booking.count({ where: { status: 'CANCELLED' } }),
      req.prisma.review.count()
    ]);
    
    // Combine pending and confirmed for "active" bookings
    const activeBookings = pendingBookings + confirmedBookings;
    
    // Deal count (may not exist in schema)
    let dealsCount = 0;
    try {
      dealsCount = await req.prisma.deal.count();
    } catch (e) {
      console.log('Deals table might not exist:', e.message);
    }

    // Revenue calculations
    const totalRevenue = await req.prisma.booking.aggregate({
      _sum: { totalPrice: true }
    });

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Since there's no createdAt field, we'll get all bookings for now
    const monthlyRevenue = await req.prisma.booking.aggregate({
      _sum: { totalPrice: true }
    });

    // Get recent bookings for activity
    const recentBookings = await req.prisma.booking.findMany({
      take: 10,
      orderBy: { id: 'desc' },  // Using id as a proxy for creation time
      include: {
        user: { select: { name: true, email: true } },
        vehicle: { select: { name: true, type: true } }
      }
    });

    // Vehicle type distribution
    const vehicleTypes = await req.prisma.vehicle.groupBy({
      by: ['type'],
      _count: true
    });

      // Top performing vehicles
    const topVehicles = await req.prisma.vehicle.findMany({
      take: 5,
      include: {
        _count: { select: { bookings: true } },
        bookings: {
          select: { 
            totalPrice: true,
            status: true 
          }
        }
      },
      orderBy: {
        bookings: { _count: 'desc' }
      }
    });
    
    // Calculate the total number of vehicles for percentage calculations
    const vehicleTypesTotal = vehicleTypes.reduce((sum, vt) => sum + vt._count, 0);    // Format the vehicle types data and calculate total for percentages
    const formattedVehicleTypes = vehicleTypes.map(vt => ({
      type: vt.type,
      count: vt._count
    }));
    
    // Calculate total bookings revenue for top vehicles
    const processedTopVehicles = topVehicles.map(vehicle => {
      // Calculate the total revenue for this vehicle
      const totalRevenueForVehicle = vehicle.bookings.reduce((sum, booking) => {
        return sum + (booking.totalPrice || 0);
      }, 0);
      
      return {
        ...vehicle,
        totalRevenue: totalRevenueForVehicle,
        bookingCount: vehicle._count.bookings
      };
    });
    
    // Handle potential null values from aggregations
    const safeRevenue = totalRevenue && totalRevenue._sum ? totalRevenue._sum.totalPrice || 0 : 0;
    const safeMonthlyRevenue = monthlyRevenue && monthlyRevenue._sum ? monthlyRevenue._sum.totalPrice || 0 : 0;

    res.render('admin/stats', {
      title: 'Statistics Dashboard',
      stats: {
        userCount,
        vehicleCount,
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        dealsCount,
        reviewsCount,
        totalRevenue: safeRevenue,
        monthlyRevenue: safeMonthlyRevenue,
        vehicleTypes: formattedVehicleTypes
      },
      recentBookings,
      topVehicles: processedTopVehicles,
      user: req.user
    });
  } catch (error) {
    console.error('Stats page error:', error);
    res.status(500).render('error', { 
      message: 'Error loading statistics',
      error: req.app.get('env') === 'development' ? error : {}
    });
  }
};

// Get Redis status (API endpoint)
exports.getRedisStatus = async (req, res) => {
  try {
    const redisClient = getRedisClient();
    
    if (!redisClient) {
      return res.json({
        integrated: true,
        connected: false,
        status: 'disconnected',
        message: 'Redis client not initialized',
        timestamp: new Date().toISOString()
      });
    }

    const isReady = redisClient.isReady;
    const isOpen = redisClient.isOpen;
    
    let pingResponse = null;
    let dbSize = null;
    let info = null;

    if (isReady) {
      try {
        pingResponse = await redisClient.ping();
        dbSize = await redisClient.dbSize();
        // Get basic info
        const rawInfo = await redisClient.info('server');
        const lines = rawInfo.split('\r\n');
        info = {};
        lines.forEach(line => {
          if (line && !line.startsWith('#') && line.includes(':')) {
            const [key, value] = line.split(':');
            info[key] = value;
          }
        });
      } catch (error) {
        console.error('Redis info error:', error);
      }
    }

    res.json({
      integrated: true,
      connected: isReady,
      status: isReady ? 'connected' : 'disconnected',
      isOpen: isOpen,
      ping: pingResponse,
      dbSize: dbSize,
      serverInfo: info ? {
        version: info.redis_version,
        uptime: info.uptime_in_seconds,
        mode: info.redis_mode
      } : null,
      message: isReady ? 'Redis is integrated and connected successfully' : 'Redis is integrated but not connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Redis status error:', error);
    res.status(500).json({
      integrated: true,
      connected: false,
      status: 'error',
      error: error.message,
      message: 'Error checking Redis status',
      timestamp: new Date().toISOString()
    });
  }
};

// Get all vehicles for admin
exports.getVehiclesAdmin = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalVehicles = await req.prisma.vehicle.count();
    
    // Get vehicles with pagination
    const vehicles = await req.prisma.vehicle.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.render('admin/vehicles', {
      title: 'Manage Vehicles',
      vehicles,
      user: req.user,
      page,
      limit,
      totalVehicles,
      successMessages: req.flash('success'),
      errorMessages: req.flash('error')
    });
  } catch (error) {
    console.error('Admin vehicles error:', error);
    res.status(500).render('error', { 
      message: 'Error loading vehicles',
      error: req.app.get('env') === 'development' ? error : {}
    });
  }
};

// Get vehicle detail for admin
exports.getVehicleDetailAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicle = await req.prisma.vehicle.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            user: true
          },
          orderBy: {
            startDate: 'desc'
          }
        },
        reviews: {
          include: {
            user: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!vehicle) {
      return res.status(404).render('error', { 
        title: 'Not Found',
        message: 'Vehicle not found',
        error: { status: 404 },
        user: req.user || null
      });
    }

    res.render('admin/vehicle-detail', {
      title: `${vehicle.name} - Admin`,
      vehicle,
      user: req.user
    });
  } catch (error) {
    console.error('Admin vehicle detail error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error loading vehicle details',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user || null
    });
  }
};

// Create a new vehicle
exports.createVehicle = async (req, res) => {
  try {
    console.log('Form submission received:', req.body);
    console.log('Content type:', req.headers['content-type']);
    console.log('User object:', req.user);
    console.log('User role:', req.user?.role);
    console.log('Session CSRF token:', req.session?.csrfToken);
    console.log('Request CSRF token:', req.body._csrf);
    
    // Check if user is authenticated and has admin role
    if (!req.user) {
      console.error('No user object found in request');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (req.user.role !== 'ADMIN') {
      console.error('User does not have admin role:', req.user.role);
      return res.status(403).json({ 
        success: false, 
        message: 'Admin privileges required' 
      });
    }
    
    // Form might be coming from multipart/form-data or application/json
    const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
    console.log('Is multipart form:', isMultipart);
    
    // Debug the form content
    console.log('Form fields received:', Object.keys(req.body));
    
    // Extract form fields
    const { make, model, year, type, pricePerDay, seats, transmission, fuelType, images, features, availability, description } = req.body;
    
    // Check if file was uploaded
    const uploadedFile = req.file;
    console.log('Uploaded file:', uploadedFile ? uploadedFile.filename : 'None');
    
    console.log('Key fields:', {
      make, 
      model, 
      type, 
      pricePerDay: typeof pricePerDay === 'string' ? pricePerDay.substring(0, 10) : pricePerDay,
      seats: typeof seats === 'string' ? seats.substring(0, 10) : seats
    });
    
    // Collect validation errors
    const validationErrors = [];
    
    // Check required fields with more lenient validation
    // And detailed logging for troubleshooting
    if (!make || make.trim() === '') {
      console.log('Make validation failed:', make);
      validationErrors.push('Make is required');
    }
    
    if (!model || model.trim() === '') {
      console.log('Model validation failed:', model);
      validationErrors.push('Model is required');
    }
    
    if (!type || type.trim() === '') {
      console.log('Type validation failed:', type);
      validationErrors.push('Type is required');
    }
    
    if (!pricePerDay || pricePerDay.toString().trim() === '') {
      console.log('Price validation failed:', pricePerDay);
      validationErrors.push('Price per day is required');
    }
    
    // If we have validation errors, return them
    if (validationErrors.length > 0) {
      const errorMsg = validationErrors.join(', ');
      console.log('Validation errors:', errorMsg);
      
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({ success: false, message: errorMsg });
      }
      req.flash('error', errorMsg);
      return res.redirect('/admin/vehicles/new');
    }
    
    // Convert values to appropriate types - with careful error handling
    let pricePerDayFloat;
    try {
      pricePerDayFloat = parseFloat(pricePerDay);
      if (isNaN(pricePerDayFloat) || pricePerDayFloat <= 0) {
        const errorMsg = 'Price per day must be a valid positive number';
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
          return res.status(400).json({ success: false, message: errorMsg });
        }
        req.flash('error', errorMsg);
        return res.redirect('/admin/vehicles/new');
      }
    } catch (e) {
      const errorMsg = 'Invalid price format';
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({ success: false, message: errorMsg });
      }
      req.flash('error', errorMsg);
      return res.redirect('/admin/vehicles/new');
    }
    
    // Parse numeric fields safely
    const yearInt = parseInt(year) || new Date().getFullYear();
    const seatsInt = parseInt(seats) || 4;
    
    // Construct specs object from form fields with defaults
    const specs = {
      make: make.trim(),
      model: model.trim(),
      year: yearInt,
      seats: seatsInt,
      transmission: transmission || 'Automatic',
      fuelType: fuelType || 'Petrol'
    };
    
    // Process features (could be array or single value)
    let featuresArray = [];
    if (features) {
      featuresArray = Array.isArray(features) ? features : [features];
    }
    
    // Process uploaded image file and images from textarea
    let imagesArray = [];
    
    // Handle uploaded file
    if (req.file) {
      // Add the path to the uploaded image
      const imageUrl = `/images/vehicles/${req.file.filename}`;
      imagesArray.push(imageUrl);
    }
    
    // Parse additional images from textarea (split by newlines)
    if (images && typeof images === 'string') {
      // Split by newlines and filter out empty strings
      const textImages = images
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      imagesArray = [...imagesArray, ...textImages];
    } else if (Array.isArray(images)) {
      const validImages = images.filter(url => url && url.trim().length > 0);
      imagesArray = [...imagesArray, ...validImages];
    }
    
    // If no images were provided, use placeholder
    if (imagesArray.length === 0) {
      imagesArray = ['/images/placeholder-car.jpg'];
    }
    
    try {
      // Create vehicle
      const vehicle = await req.prisma.vehicle.create({
        data: {
          name: `${make} ${model}`,
          type,
          pricePerDay: pricePerDayFloat,
          specs,
          description: description || `${make} ${model} ${year} - ${transmission} ${fuelType}`,
          images: imagesArray,
          features: featuresArray,
          availability: availability === 'on' || availability === true || availability === 'true'
        }
      });
      
      console.log('Vehicle created successfully:', vehicle);
      
      // Invalidate all vehicle caches since a new vehicle was added
      await deleteCachePattern('vehicles:*');
      await deleteCachePattern('vehicle:detail:*');
      await deleteCachePattern('admin:dashboard:*');
      
      // Handle different response types
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(201).json({ 
          success: true, 
          message: `Vehicle ${make} ${model} has been added successfully.`,
          vehicle: vehicle,
          redirectUrl: '/admin/vehicles'
        });
      }
      
      // Add success flash message for form submission
      req.flash('success', `Vehicle ${make} ${model} has been added successfully.`);
      
      // Redirect to vehicles list
      res.redirect('/admin/vehicles');
    } catch (dbError) {
      console.error('Database error creating vehicle:', dbError);
      
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({ 
          success: false, 
          message: `Database error: ${dbError.message}` 
        });
      }
      
      req.flash('error', `Error saving vehicle: ${dbError.message}`);
      res.redirect('/admin/vehicles/new');
    }
  } catch (error) {
    console.error('Create vehicle error:', error);
    
    // Handle different response types
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({ 
        success: false, 
        message: `Error creating vehicle: ${error.message}`
      });
    }
    
    req.flash('error', `Error creating vehicle: ${error.message}`);
    res.redirect('/admin/vehicles/new');
  }
};

// Get vehicle form
exports.getVehicleForm = async (req, res) => {
  try {
    const vehicleId = req.params.id;
    let vehicle = null;
    
    if (vehicleId) {
      vehicle = await req.prisma.vehicle.findUnique({
        where: { id: vehicleId }
      });
      
      if (!vehicle) {
        return res.status(404).render('error', { 
          message: 'Vehicle not found',
          error: { status: 404 }
        });
      }
    }
    
    res.render('admin/vehicle-form', { 
      title: vehicle ? 'Edit Vehicle' : 'Add New Vehicle',
      vehicle,
      user: req.user,
      successMessages: req.flash('success'),
      errorMessages: req.flash('error')
    });
  } catch (error) {
    console.error('Get vehicle form error:', error);
    res.status(500).render('error', { 
      message: 'Error loading vehicle form',
      error: req.app.get('env') === 'development' ? error : {}
    });
  }
};

// Update a vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { make, model, year, type, pricePerDay, seats, transmission, fuelType, images, features, availability, description } = req.body;
    
    console.log('Update vehicle request received:', { id, body: req.body });
    
    // Collect validation errors
    const validationErrors = [];
    
    // Check required fields
    if (!make) validationErrors.push('Make is required');
    if (!model) validationErrors.push('Model is required');
    if (!type) validationErrors.push('Type is required');
    if (!pricePerDay) validationErrors.push('Price per day is required');
    
    // If we have validation errors, return them
    if (validationErrors.length > 0) {
      const errorMsg = validationErrors.join(', ');
      return res.status(400).json({ 
        success: false, 
        message: errorMsg
      });
    }
    
    // Parse numeric values safely
    let pricePerDayFloat;
    try {
      pricePerDayFloat = parseFloat(pricePerDay);
      if (isNaN(pricePerDayFloat) || pricePerDayFloat <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Price per day must be a valid positive number'
        });
      }
    } catch (e) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid price format'
      });
    }
    
    // Parse other numeric fields safely
    const yearInt = parseInt(year) || new Date().getFullYear();
    const seatsInt = parseInt(seats) || 4;
    
    // Construct specs object from form fields with defaults
    const specs = {
      make: make.trim(),
      model: model.trim(),
      year: yearInt,
      seats: seatsInt,
      transmission: transmission || 'Automatic',
      fuelType: fuelType || 'Petrol'
    };
    
    // Parse images as array if it's a string
    let imagesArray = images;
    if (typeof images === 'string') {
      try {
        imagesArray = JSON.parse(images);
      } catch (e) {
        imagesArray = [images]; // Treat as single image
      }
    } else if (!images) {
      imagesArray = ['/images/placeholder-car.jpg'];
    }
    
    try {
      // Update vehicle
      const updatedVehicle = await req.prisma.vehicle.update({
        where: { id },
        data: {
          name: `${make} ${model}`,
          type,
          pricePerDay: pricePerDayFloat,
          specs,
          description: description || `${make} ${model} ${yearInt} - ${transmission} ${fuelType}`,
          images: imagesArray,
          features: Array.isArray(features) ? features : features ? [features] : [],
          availability: availability === 'on' || availability === true || availability === 'true'
        }
      });
      
      console.log('Vehicle updated successfully:', updatedVehicle);
      
      // Invalidate all vehicle caches since vehicle data was modified
      await deleteCachePattern('vehicles:*');
      
      // Check if this is an API request or a regular form submission
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(200).json({ 
          success: true, 
          message: `Vehicle ${make} ${model} has been updated successfully.`,
          vehicle: updatedVehicle,
          redirectUrl: '/admin/vehicles'
        });
      }
      
      req.flash('success', `Vehicle ${make} ${model} has been updated successfully.`);
      res.redirect('/admin/vehicles');
    } catch (dbError) {
      console.error('Database error updating vehicle:', dbError);
      
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({ 
          success: false, 
          message: `Error updating vehicle: ${dbError.message}` 
        });
      }
      
      req.flash('error', `Error updating vehicle: ${dbError.message}`);
      res.redirect(`/admin/vehicles/${req.params.id}/edit`);
    }
  } catch (error) {
    console.error('Update vehicle error:', error);
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({ 
        success: false, 
        message: `Error updating vehicle: ${error.message}` 
      });
    }
    
    req.flash('error', `Error updating vehicle: ${error.message}`);
    res.redirect(`/admin/vehicles/${req.params.id}/edit`);
  }
};

// Delete a vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if vehicle exists
    const vehicle = await req.prisma.vehicle.findUnique({
      where: { id }
    });
    
    if (!vehicle) {
      return res.status(404).json({ 
        success: false, 
        message: 'Vehicle not found' 
      });
    }
    
    // Delete vehicle
    await req.prisma.vehicle.delete({
      where: { id }
    });
    
    // Invalidate all vehicle caches since a vehicle was deleted
    await deleteCachePattern('vehicles:*');
    
    req.flash('success', 'Vehicle has been deleted successfully.');
    res.redirect('/admin/vehicles');
  } catch (error) {
    console.error('Delete vehicle error:', error);
    
    // Check if error is due to foreign key constraint
    if (error.code === 'P2003') {
      req.flash('error', 'Cannot delete vehicle because it has associated bookings or reviews.');
    } else {
      req.flash('error', `Error deleting vehicle: ${error.message}`);
    }
    
    res.redirect('/admin/vehicles');
  }
};

// Get all bookings for admin
exports.getBookingsAdmin = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalBookings = await req.prisma.booking.count();
    
    // Get bookings with pagination
    const bookings = await req.prisma.booking.findMany({
      skip,
      take: limit,
      orderBy: {
        startDate: 'desc'
      },
      include: {
        user: true,
        vehicle: true
      }
    });
    
    res.render('admin/bookings', {
      title: 'Manage Bookings',
      bookings,
      user: req.user,
      page,
      limit,
      totalBookings,
      successMessages: req.flash('success'),
      errorMessages: req.flash('error')
    });
  } catch (error) {
    console.error('Admin bookings error:', error);
    res.status(500).render('error', { 
      message: 'Error loading bookings',
      error: req.app.get('env') === 'development' ? error : {}
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }
    
    const booking = await req.prisma.booking.update({
      where: { id },
      data: { status }
    });
    
    res.status(200).json({
      success: true,
      booking,
      message: `Booking ${status.toLowerCase()}`
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating booking status' 
    });
  }
};

// Get broadcasts for admin
exports.getBroadcastsAdmin = async (req, res) => {
  try {
    const cacheKey = 'broadcasts:all';
    
    // Try to get from cache first
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.render('admin/broadcasts', {
        title: 'Manage Broadcasts',
        broadcasts: cached,
        user: req.user,
        successMessages: req.flash('success'),
        errorMessages: req.flash('error')
      });
    }
    
    // Get all broadcasts
    const broadcasts = await req.prisma.broadcast.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Cache for 2 minutes
    await setCache(cacheKey, broadcasts, 120);
    
    res.render('admin/broadcasts', {
      title: 'Manage Broadcasts',
      broadcasts,
      user: req.user,
      successMessages: req.flash('success'),
      errorMessages: req.flash('error')
    });
  } catch (error) {
    console.error('Admin broadcasts error:', error);
    res.status(500).render('error', { 
      message: 'Error loading broadcasts',
      error: req.app.get('env') === 'development' ? error : {}
    });
  }
};

// Create a new broadcast
exports.createBroadcast = async (req, res) => {
  try {
    const { title, message, userTarget } = req.body;
    
    // Enhanced logging for debugging
    console.log('Creating broadcast - Request details:', {
      title,
      message,
      userTarget,
      auth: req.auth ? { userId: req.auth.userId } : null,
      user: req.user ? { id: req.user.id, email: req.user.email, role: req.user.role } : null,
      headers: req.headers['content-type'],
      session: req.session ? { id: req.session.id } : null
    });
    
    // Validate input
    if (!message) {
      if (req.headers['content-type'] === 'application/json') {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }
      req.flash('error', 'Message is required');
      return res.redirect('/admin/broadcasts');
    }
    
    // Check if user is authenticated properly
    if (!req.user || !req.user.id) {
      console.error('Authentication error: Missing user or user ID');
      
      if (req.headers['content-type'] === 'application/json') {
        return res.status(401).json({ 
          success: false, 
          error: 'Authentication required. Please login again.',
          debug: { 
            auth: req.auth ? { exists: true, userId: req.auth.userId } : null,
            session: req.session ? { exists: true, id: req.session.id } : null
          }
        });
      }
      
      req.flash('error', 'Authentication error: Please log in again');
      return res.redirect('/auth/login');
    }
    
    // Log admin ID before creating broadcast
    console.log('Admin ID for broadcast creation:', req.user.id);
    
    // Create broadcast with explicit adminId handling
    const adminId = req.user.id;
    if (!adminId) {
      throw new Error('Invalid admin ID');
    }
    
    const broadcast = await req.prisma.broadcast.create({
      data: {
        title: title || 'Admin Broadcast',
        message: message || title,
        userTarget: userTarget || 'ALL',
        adminId: adminId
      }
    });
    
    // Invalidate broadcasts cache
    await deleteCachePattern('broadcasts:*');
    
    // Socket.io notification would go here if socket is available
    if (req.app.get('io')) {
      req.app.get('io').emit('broadcast', {
        id: broadcast.id,
        title: broadcast.title,
        message: broadcast.message,
        timestamp: broadcast.createdAt
      });
    }
    
    // Return JSON for API calls, redirect for form submissions
    if (req.headers['content-type'] === 'application/json') {
      return res.json({ 
        success: true, 
        message: 'Broadcast sent successfully',
        broadcast: broadcast
      });
    }
    
    req.flash('success', 'Broadcast has been sent successfully.');
    res.redirect('/admin/broadcasts');
  } catch (error) {
    console.error('Create broadcast error:', error);
    
    if (req.headers['content-type'] === 'application/json') {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    req.flash('error', `Error creating broadcast: ${error.message}`);
    res.redirect('/admin/broadcasts');
  }
};

// Get all vehicle requests for admin
exports.getVehicleRequests = async (req, res) => {
  try {
    // Get status filter and pagination from query params
    const statusFilter = req.query.status || 'all';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    // Build the where clause based on status
    let whereClause = {};
    if (statusFilter !== 'all') {
      whereClause.status = statusFilter.toUpperCase();
    }
    
    // Get total count for pagination
    const totalRequests = await req.prisma.vehicleRequest.count({
      where: whereClause
    });
    
    const totalPages = Math.ceil(totalRequests / limit);
    
    // Get vehicle requests with optional status filter and pagination
    const vehicleRequests = await req.prisma.vehicleRequest.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true
      },
      skip,
      take: limit
    });
    
    res.render('admin/vehicle-requests', {
      title: 'Vehicle Requests',
      vehicleRequests,
      currentStatus: statusFilter,
      page,
      totalPages,
      totalRequests,
      limit,
      user: req.user,
      successMessages: req.flash('success'),
      errorMessages: req.flash('error')
    });
  } catch (error) {
    console.error('Admin vehicle requests error:', error);
    res.status(500).render('error', { 
      message: 'Error loading vehicle requests',
      error: req.app.get('env') === 'development' ? error : {}
    });
  }
};

// Update vehicle request status
exports.updateVehicleRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status'
      });
    }
    
    const vehicleRequest = await req.prisma.vehicleRequest.update({
      where: { id },
      data: { 
        status 
      }
    });
    
    // If the request is approved, we can optionally create a new vehicle
    if (status === 'APPROVED') {
      // You could implement auto-creation of the vehicle here
    }
    
    res.status(200).json({
      success: true,
      vehicleRequest,
      message: `Request ${status.toLowerCase()}`
    });
  } catch (error) {
    console.error('Update vehicle request status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating request status' 
    });
  }
};

// Get deals for admin
exports.getDealsAdmin = async (req, res) => {
  try {
    let deals = [];
    
    // Check if the deals table exists in the schema
    try {
      deals = await req.prisma.deal.findMany({
        orderBy: {
          id: 'desc'
        }
      });
    } catch (error) {
      console.log('Deals table might not exist:', error.message);
      // Table doesn't exist, we'll return an empty array
    }
    
    res.render('admin/deals', {
      title: 'Manage Deals',
      deals,
      user: req.user
    });
  } catch (error) {
    console.error('Admin deals error:', error);
    res.status(500).render('error', { 
      message: 'Error loading deals',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user
    });
  }
};

// Show form to create a new deal
exports.getNewDealForm = async (req, res) => {
  try {
    res.render('admin/deal-form', {
      title: 'Create New Deal',
      deal: null,
      user: req.user
    });
  } catch (error) {
    console.error('New deal form error:', error);
    res.status(500).render('error', { 
      message: 'Error loading deal form',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user
    });
  }
};

// Show form to edit an existing deal
exports.getEditDealForm = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the deal to edit
    const deal = await req.prisma.deal.findUnique({
      where: { id }
    });
    
    if (!deal) {
      return res.status(404).render('error', { 
        title: 'Not Found',
        message: 'Deal not found',
        error: { status: 404 },
        user: req.user
      });
    }
    
    res.render('admin/deal-form', {
      title: 'Edit Deal',
      deal,
      user: req.user
    });
  } catch (error) {
    console.error('Edit deal form error:', error);
    res.status(500).render('error', { 
      message: 'Error loading deal form',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user
    });
  }
};

// Create a new deal
exports.createDeal = async (req, res) => {
  try {
    console.log('Creating deal - Request body:', req.body);
    
    const { 
      title, 
      code, 
      description, 
      discountType, 
      discountValue, 
      minPurchase, 
      validFrom, 
      validUntil,
      usageLimit, 
      vehicleType, 
      isActive 
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !discountType || !discountValue || !validFrom || !validUntil) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields'
      });
    }
    
    // Generate a random code if not provided
    const dealCode = code || `DEAL${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Parse numeric values
    const discountValueNum = parseFloat(discountValue);
    const minPurchaseNum = minPurchase ? parseFloat(minPurchase) : null;
    const usageLimitNum = usageLimit ? parseInt(usageLimit) : null;
    
    // Create the deal
    const deal = await req.prisma.deal.create({
      data: {
        title,
        code: dealCode,
        description,
        discountType,
        discountValue: discountValueNum,
        minPurchase: minPurchaseNum,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        usageLimit: usageLimitNum,
        vehicleType: vehicleType || null,
        isActive: isActive === 'on' || isActive === true || isActive === 'true',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('Deal created successfully:', deal);
    
    // Invalidate all deal caches since a new deal was added
    await deleteCachePattern('deals:*');
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(201).json({ 
        success: true, 
        message: 'Deal created successfully',
        deal
      });
    }
    
    req.flash('success', 'Deal created successfully');
    res.redirect('/admin/deals');
  } catch (error) {
    console.error('Create deal error:', error);
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({ 
        success: false, 
        message: `Error creating deal: ${error.message}`
      });
    }
    
    req.flash('error', `Error creating deal: ${error.message}`);
    res.redirect('/admin/deals/new');
  }
};

// Update an existing deal
exports.updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { 
      title, 
      code, 
      description, 
      discountType, 
      discountValue, 
      minPurchase, 
      validFrom, 
      validUntil,
      usageLimit, 
      vehicleType, 
      isActive 
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !discountType || !discountValue || !validFrom || !validUntil) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields'
      });
    }
    
    // Parse numeric values
    const discountValueNum = parseFloat(discountValue);
    const minPurchaseNum = minPurchase ? parseFloat(minPurchase) : null;
    const usageLimitNum = usageLimit ? parseInt(usageLimit) : null;
    
    // Update the deal
    const deal = await req.prisma.deal.update({
      where: { id },
      data: {
        title,
        code,
        description,
        discountType,
        discountValue: discountValueNum,
        minPurchase: minPurchaseNum,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        usageLimit: usageLimitNum,
        vehicleType: vehicleType || null,
        isActive: isActive === 'on' || isActive === true || isActive === 'true',
        updatedAt: new Date()
      }
    });
    
    // Invalidate all deal caches since deal data was modified
    await deleteCachePattern('deals:*');
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(200).json({ 
        success: true, 
        message: 'Deal updated successfully',
        deal
      });
    }
    
    req.flash('success', 'Deal updated successfully');
    res.redirect('/admin/deals');
  } catch (error) {
    console.error('Update deal error:', error);
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({ 
        success: false, 
        message: `Error updating deal: ${error.message}`
      });
    }
    
    req.flash('error', `Error updating deal: ${error.message}`);
    res.redirect(`/admin/deals/${req.params.id}/edit`);
  }
};

// Delete a deal
exports.deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete the deal
    await req.prisma.deal.delete({
      where: { id }
    });
    
    // Invalidate all deal caches since a deal was deleted
    await deleteCachePattern('deals:*');
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(200).json({ 
        success: true, 
        message: 'Deal deleted successfully'
      });
    }
    
    req.flash('success', 'Deal deleted successfully');
    res.redirect('/admin/deals');
  } catch (error) {
    console.error('Delete deal error:', error);
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({ 
        success: false, 
        message: `Error deleting deal: ${error.message}`
      });
    }
    
    req.flash('error', `Error deleting deal: ${error.message}`);
    res.redirect('/admin/deals');
  }
};

// Cache Viewer - View all cached data
exports.getCacheViewer = async (req, res) => {
  try {
    const redisClient = getRedisClient();
    
    if (!redisClient || !redisClient.isReady) {
      return res.render('admin/cache-viewer', {
        title: 'Cache Viewer',
        user: req.user,
        error: 'Redis is not connected',
        keys: [],
        cacheData: {},
        totalKeys: 0
      });
    }
    
    // Get all keys
    const keys = await redisClient.keys('*');
    
    // Get data for each key
    const cacheData = {};
    for (const key of keys) {
      try {
        const type = await redisClient.type(key);
        const ttl = await redisClient.ttl(key);
        
        let value;
        if (type === 'string') {
          value = await redisClient.get(key);
          // Try to parse as JSON
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Keep as string if not JSON
          }
        } else if (type === 'hash') {
          value = await redisClient.hGetAll(key);
        } else if (type === 'list') {
          value = await redisClient.lRange(key, 0, -1);
        } else if (type === 'set') {
          value = await redisClient.sMembers(key);
        }
        
        cacheData[key] = {
          type,
          ttl: ttl === -1 ? 'No expiry' : `${ttl}s`,
          value
        };
      } catch (error) {
        console.error(`Error getting data for key ${key}:`, error);
        cacheData[key] = { error: error.message };
      }
    }
    
    res.render('admin/cache-viewer', {
      title: 'Redis Cache Viewer',
      user: req.user,
      error: null,
      keys,
      cacheData,
      totalKeys: keys.length
    });
  } catch (error) {
    console.error('Cache viewer error:', error);
    res.status(500).render('error', {
      message: 'Error loading cache viewer',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user
    });
  }
};

// Clear Cache - Clear specific pattern or all cache
exports.clearCache = async (req, res) => {
  try {
    const { pattern } = req.body;
    const redisClient = getRedisClient();
    
    if (!redisClient || !redisClient.isReady) {
      return res.status(500).json({
        success: false,
        message: 'Redis is not connected'
      });
    }
    
    if (pattern && pattern !== '*') {
      // Clear specific pattern
      await deleteCachePattern(pattern);
      return res.json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`
      });
    } else {
      // Clear all cache
      await redisClient.flushDb();
      return res.json({
        success: true,
        message: 'All cache cleared successfully'
      });
    }
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: `Error clearing cache: ${error.message}`
    });
  }
};