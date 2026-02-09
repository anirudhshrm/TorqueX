/**
 * Role Middleware
 * Restricts access based on user role
 */

// Middleware to require admin role
exports.requireAdmin = (req, res, next) => {
  // User must be authenticated first
  if (!req.user) {
    return res.redirect('/auth/login');
  }
  
  // Check if user has admin role
  if (req.user.role !== 'ADMIN') {
    return res.status(403).render('error', { 
      message: 'Access Denied: Admin privileges required',
      error: { status: 403 }
    });
  }
  
  next();
};

// Middleware to require specific role
exports.requireRole = (role) => {
  return (req, res, next) => {
    // User must be authenticated first
    if (!req.user) {
      return res.redirect('/auth/login');
    }
    
    // Check if user has required role
    if (req.user.role !== role) {
      return res.status(403).render('error', { 
        message: `Access Denied: ${role} privileges required`,
        error: { status: 403 }
      });
    }
    
    next();
  };
};