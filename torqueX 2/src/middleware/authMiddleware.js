const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Middleware to require authentication
exports.requireAuth = async (req, res, next) => {
  try {
    // Check if manual authentication is being used (fallback)
    if (req.session && req.session.manualAuth && req.session.userId) {
      const user = await req.prisma.user.findUnique({
        where: { id: req.session.userId }
      });
      
      if (user) {
        req.user = user;
        next();
        return;
      } else {
        // User not found in DB despite having session
        req.session.destroy();
        req.flash('error', 'Session expired. Please login again.');
        return res.redirect('/auth/login');
      }
    }
    
    // If not authenticated by Clerk
    if (!req.auth || !req.auth.userId) {
      return res.redirect('/auth/login');
    }
    
    // Get user from DB based on Clerk ID
    const user = await req.prisma.user.findUnique({
      where: { clerkId: req.auth.userId }
    });
    
    // If user doesn't exist in our DB, try to create the user from Clerk data
    if (!user) {
      try {
        const clerkUser = await req.clerk.users.getUser(req.auth.userId);
        
        // Create a new user in our database
        const newUser = await req.prisma.user.create({
          data: {
            clerkId: req.auth.userId,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'New User',
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            role: 'USER', // Default role
          }
        });
        
        req.user = newUser;
        next();
      } catch (error) {
        console.error('Error creating user from Clerk data:', error);
        req.flash('error', 'Authentication error. Please try logging in again.');
        return res.redirect('/auth/login');
      }
    } else {
      // Add user to request object
      req.user = user;
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    req.flash('error', 'Authentication error. Please try logging in again.');
    res.redirect('/auth/login');
  }
};

// Middleware to optionally add user to request
exports.populateUser = async (req, res, next) => {
  try {
    // Check if manual authentication is being used (fallback)
    if (req.session && req.session.manualAuth && req.session.userId) {
      console.log('Manual auth session found, userId:', req.session.userId);
      
      const user = await req.prisma.user.findUnique({
        where: { id: req.session.userId }
      });
      
      if (user) {
        console.log('User found from session:', user.email);
        req.user = user;
        res.locals.isAuthenticated = true;
        res.locals.user = user;
        next();
        return;
      } else {
        console.log('Session user not found in database, clearing session');
        req.session.manualAuth = false;
        req.session.userId = null;
      }
    }
    
    // If authenticated via Clerk
    if (req.auth && req.auth.userId) {
      console.log('Clerk auth found, userId:', req.auth.userId);
      // Get user from DB based on Clerk ID
      const user = await req.prisma.user.findUnique({
        where: { clerkId: req.auth.userId }
      });
      
      // Add user to request object if found
      if (user) {
        console.log('User found from Clerk auth:', user.email);
        req.user = user;
      } else {
        console.log('Clerk user not found in database');
      }
    }
    
    // Add authentication status to response locals for templates
    res.locals.isAuthenticated = !!req.auth?.userId || !!(req.session && req.session.manualAuth);
    res.locals.user = req.user || null;
    
    next();
  } catch (error) {
    console.error('Populate user error:', error);
    res.locals.isAuthenticated = false;
    res.locals.user = null;
    next();
  }
};