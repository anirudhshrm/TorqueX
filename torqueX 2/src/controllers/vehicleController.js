/**
 * Vehicle Controller
 * Handles vehicle listings and individual vehicle details
 */

const { getCache, setCache, CacheKeys } = require('../utils/redis');

// Get all vehicles with optional filtering
exports.getAllVehicles = async (req, res) => {
  try {
    // Parse query parameters for filtering
    const { type, minPrice, maxPrice, available } = req.query;
    
    // Create cache key based on filters
    const cacheKey = `vehicles:list:${JSON.stringify({ type, minPrice, maxPrice, available })}`;
    
    // Try to get from cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.render('vehicles/index', { 
        title: 'Browse Vehicles',
        vehicles: cached.vehicles,
        types: cached.types,
        filters: req.query,
        user: req.user || null
      });
    }
    
    // Build filter object
    const filter = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.gte = parseFloat(minPrice);
      if (maxPrice) filter.pricePerDay.lte = parseFloat(maxPrice);
    }
    
    if (available === 'true') {
      filter.availability = true;
    }
    
    // Get vehicles with filters
    const vehicles = await req.prisma.vehicle.findMany({
      where: filter,
      orderBy: {
        pricePerDay: 'asc'
      }
    });
    
    // Get all available types for filter options
    const types = await req.prisma.vehicle.findMany({
      select: {
        type: true
      },
      distinct: ['type']
    });
    
    const typesArray = types.map(t => t.type);
    
    // Cache the results for 5 minutes
    await setCache(cacheKey, { vehicles, types: typesArray }, 300);
    
    res.render('vehicles/index', { 
      title: 'Browse Vehicles',
      vehicles,
      types: typesArray,
      filters: req.query,
      user: req.user || null
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error loading vehicles',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user || null
    });
  }
};

// Get a single vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Fetching vehicle with ID:', id);
    
    // Try to get from cache
    const cacheKey = `vehicle:detail:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log('Vehicle loaded from cache:', id);
      return res.render('vehicles/detail', cached);
    }
    
    // Get vehicle with reviews
    const vehicle = await req.prisma.vehicle.findUnique({
      where: { id },
      include: {
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
      console.log('Vehicle not found with ID:', id);
      return res.status(404).render('error', { 
        title: 'Not Found',
        message: 'Vehicle not found',
        error: { status: 404 },
        user: req.user || null
      });
    }
    
    console.log('Vehicle found:', vehicle.name);
    
    // Calculate average rating
    let avgRating = 0;
    if (vehicle.reviews.length > 0) {
      avgRating = vehicle.reviews.reduce((sum, review) => sum + review.rating, 0) / vehicle.reviews.length;
    }
    
    // Check if user has booked this vehicle before
    let userHasBooked = false;
    if (req.user) {
      const booking = await req.prisma.booking.findFirst({
        where: {
          userId: req.user.id,
          vehicleId: id,
          status: 'COMPLETED'
        }
      });
      userHasBooked = !!booking;
    }
    
    // Prepare response data
    const responseData = {
      title: vehicle.name,
      vehicle,
      avgRating,
      userHasBooked,
      user: req.user || null
    };
    
    // Cache for 2 minutes (shorter TTL since reviews can be added)
    await setCache(cacheKey, responseData, 120);
    
    res.render('vehicles/detail', responseData);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error loading vehicle details',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user || null
    });
  }
};

// Get booking form for a vehicle
exports.getBookingForm = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is authenticated
    if (!req.user) {
      return res.redirect(`/auth/login?redirect=/vehicles/${id}/book`);
    }
    
    // Get vehicle details
    const vehicle = await req.prisma.vehicle.findUnique({
      where: { id }
    });
    
    if (!vehicle) {
      return res.status(404).render('error', { 
        title: 'Not Found',
        message: 'Vehicle not found',
        error: { status: 404 },
        user: req.user
      });
    }
    
    if (!vehicle.availability) {
      return res.status(400).render('error', { 
        title: 'Unavailable',
        message: 'This vehicle is currently not available for booking',
        error: { status: 400 },
        user: req.user
      });
    }
    
    res.render('bookings/form', { 
      title: 'Book ' + vehicle.name,
      vehicle,
      vehicleId: id,
      user: req.user
    });
  } catch (error) {
    console.error('Get booking form error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error loading booking form',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user
    });
  }
};