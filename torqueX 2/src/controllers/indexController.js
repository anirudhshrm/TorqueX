/**
 * Index Controller
 * Handles home page, about page, and contact page
 */

const { getCache, setCache } = require('../utils/redis');

// Home page controller
exports.getHomePage = async (req, res) => {
  try {
    const cacheKey = 'homepage:featured';
    
    // Try to get from cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.render('index', { 
        title: 'TorqueX - Premium Vehicle Rentals',
        featuredVehicles: cached.featuredVehicles,
        activeDeal: cached.activeDeal,
        user: req.user || null
      });
    }
    
    // Get featured vehicles and active deals
    const featuredVehicles = await req.prisma.vehicle.findMany({
      where: { availability: true },
      take: 6,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const activeDeal = await req.prisma.deal.findFirst({
      where: {
        validUntil: {
          gte: new Date()
        }
      },
      orderBy: {
        validUntil: 'asc'
      }
    });
    
    // Cache for 3 minutes
    await setCache(cacheKey, { featuredVehicles, activeDeal }, 180);

    res.render('index', { 
      title: 'TorqueX - Premium Vehicle Rentals',
      featuredVehicles,
      activeDeal,
      user: req.user || null
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).render('error', { 
      title: 'Error',
      message: 'Error loading the home page',
      error: req.app.get('env') === 'development' ? error : {},
      user: req.user || null
    });
  }
};

// About page controller
exports.getAboutPage = (req, res) => {
  res.render('about', { 
    title: 'About TorqueX',
    user: req.user || null
  });
};

// Contact page controller
exports.getContactPage = (req, res) => {
  res.render('contact', { 
    title: 'Contact Us',
    user: req.user || null
  });
};

// Contact form submission controller
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      req.flash('error', 'Please fill in all required fields.');
      return res.redirect('/contact');
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      req.flash('error', 'Please enter a valid email address.');
      return res.redirect('/contact');
    }
    
    // In a real application, you would:
    // 1. Save to database
    // 2. Send email notification
    // 3. Send confirmation email to user
    
    // For now, we'll just simulate success
    console.log('Contact form submission:', {
      name,
      email,
      phone,
      subject,
      message,
      timestamp: new Date()
    });
    
    req.flash('success', 'Thank you for your message! We\'ll get back to you within 24 hours.');
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact form error:', error);
    req.flash('error', 'Sorry, there was an error submitting your message. Please try again.');
    res.redirect('/contact');
  }
};