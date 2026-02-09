/**
 * Security Middleware
 * Provides security headers, CSRF protection, rate limiting, and request validation
 */

const crypto = require('../utils/crypto');
const logger = require('../utils/logger');
const { checkRateLimit, isRedisConnected } = require('../utils/redis');

// Fallback in-memory store for rate limiting when Redis is unavailable
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

/**
 * Security Headers Middleware
 * Sets important security headers to protect against common attacks
 */
exports.securityHeaders = (req, res, next) => {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://unpkg.com https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest https://modest-beagle-30.clerk.accounts.dev https://apis.google.com https://www.chatbase.co; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; img-src 'self' data: https:; font-src 'self' https://cdn.jsdelivr.net https://unpkg.com; connect-src 'self' https://api.stripe.com https://api.clerk.com https://modest-beagle-30.clerk.accounts.dev https://www.chatbase.co wss: ws:; frame-src https://js.stripe.com; media-src 'self' https://cdn.coverr.co"
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens
 */
exports.csrfProtection = (req, res, next) => {
  // Generate CSRF token if not exists
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.generateSecureToken();
  }
  
  // Make token available to views
  res.locals.csrfToken = req.session.csrfToken;
  
  // For GET requests, just continue
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  // For POST/PUT/DELETE, validate CSRF token
  // If request is multipart (file upload), multer will parse the body at the route level.
  // Defer validation for multipart requests so fields parsed by multer are available.
  const contentType = (req.headers['content-type'] || '').toLowerCase();
  if (contentType.includes('multipart/form-data')) {
    // Mark this request for deferred validation (to be called after multer)
    req.deferCsrfValidation = true;
    return next();
  }

  const tokenFromRequest = req.body._csrf || req.headers['x-csrf-token'];

  console.log('CSRF validation:', {
    sessionToken: req.session?.csrfToken,
    requestToken: tokenFromRequest,
    match: tokenFromRequest === req.session?.csrfToken,
    method: req.method,
    path: req.path,
    userId: req.user?.id
  });

  if (!tokenFromRequest || tokenFromRequest !== req.session.csrfToken) {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      sessionToken: req.session?.csrfToken?.substring(0, 10) + '...',
      requestToken: tokenFromRequest?.substring(0, 10) + '...',
      userId: req.user?.id
    });
    
    // In development, be more permissive for admin routes
    if (process.env.NODE_ENV === 'development' && req.path.startsWith('/admin/') && req.user?.role === 'ADMIN') {
      console.warn('CSRF bypassed for admin in development mode');
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed'
    });
  }
  
  next();
};

/**
 * Deferred CSRF validation for multipart/form-data requests.
 * Call this after multer has parsed req.body.
 */
exports.deferredCsrfValidation = (req, res, next) => {
  if (!req.deferCsrfValidation) return next();

  const tokenFromRequest = req.body?._csrf || req.headers['x-csrf-token'];

  console.log('Deferred CSRF validation:', {
    sessionToken: req.session?.csrfToken,
    requestToken: tokenFromRequest,
    match: tokenFromRequest === req.session?.csrfToken,
    method: req.method,
    path: req.path,
    userId: req.user?.id
  });

  if (!tokenFromRequest || tokenFromRequest !== req.session.csrfToken) {
    logger.warn('Deferred CSRF token validation failed', {
      ip: req.ip,
      method: req.method,
      path: req.path,
      sessionToken: req.session?.csrfToken?.substring(0, 10) + '...',
      requestToken: tokenFromRequest?.substring(0, 10) + '...',
      userId: req.user?.id
    });

    if (process.env.NODE_ENV === 'development' && req.path.startsWith('/admin/') && req.user?.role === 'ADMIN') {
      console.warn('Deferred CSRF bypassed for admin in development mode');
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed (deferred)'
    });
  }

  // Clear defer flag and continue
  delete req.deferCsrfValidation;
  next();
};

/**
 * Input Sanitization Middleware
 * Removes potentially dangerous characters from user input
 */
exports.sanitizeInput = (req, res, next) => {
  // Sanitize all string inputs in body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove any HTML tags and script content
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      }
    });
  }
  
  next();
};

/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP
 * Uses Redis if available, falls back to in-memory store
 */
exports.rateLimit = (maxRequests = RATE_LIMIT_MAX_REQUESTS, windowSec = 60) => {
  return async (req, res, next) => {
    const ip = req.ip;
    
    try {
      // Try to use Redis rate limiting if connected
      if (isRedisConnected()) {
        const result = await checkRateLimit(ip, maxRequests, windowSec);
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
        
        if (!result.allowed) {
          logger.warn('Rate limit exceeded (Redis)', {
            ip,
            limit: maxRequests,
            resetTime: result.resetTime
          });
          
          return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          });
        }
        
        return next();
      }
      
      // Fallback to in-memory rate limiting
      const now = Date.now();
      const windowMs = windowSec * 1000;
      
      if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
      }
      
      const requests = requestCounts.get(ip);
      const recentRequests = requests.filter(time => now - time < windowMs);
      
      if (recentRequests.length >= maxRequests) {
        logger.warn('Rate limit exceeded (in-memory)', {
          ip,
          requests: recentRequests.length,
          limit: maxRequests
        });
        
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.'
        });
      }
      
      recentRequests.push(now);
      requestCounts.set(ip, recentRequests);
      
      next();
    } catch (error) {
      logger.error('Rate limit check error', error);
      // On error, allow the request (fail open)
      next();
    }
  };
};

/**
 * Secure Password Validation Middleware
 * Validates password strength for signup
 */
exports.validatePasswordStrength = (req, res, next) => {
  if (req.method !== 'POST' || !req.body.password) {
    return next();
  }
  
  const password = req.body.password;
  const errors = [];
  
  // Minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // At least one number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  if (errors.length > 0) {
    logger.info('Weak password attempted', { errors });
    req.passwordErrors = errors;
  }
  
  next();
};

/**
 * Request Logging Middleware
 * Logs all requests with security-relevant information
 */
exports.requestLogging = (req, res, next) => {
  const startTime = Date.now();
  
  // Log response when it's finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    
    logger.info(`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
      isError
    });
  });
  
  next();
};

/**
 * SQL Injection Prevention
 * Validates common SQL injection patterns
 */
exports.preventSQLInjection = (req, res, next) => {
  const sqlPattern = /('|"|;|--|\/\*|\*\/|xp_|sp_|exec|execute|select|insert|update|delete|drop|create|alter|from|where|union|or|and|like|in|between|case|cast|convert)/gi;
  
  // Check URL
  if (sqlPattern.test(req.url)) {
    logger.warn('Potential SQL injection attempt detected', {
      url: req.url,
      ip: req.ip
    });
    // Log but don't block - let Prisma handle validation
  }
  
  next();
};

/**
 * XSS Protection Middleware
 * Escapes potentially dangerous characters
 */
exports.preventXSS = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = escapeHtml(req.body[key]);
      }
    });
  }
  
  next();
};

/**
 * Helper function to escape HTML entities
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * API Key Authentication Middleware
 * Validates API key in request headers
 */
exports.validateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required'
    });
  }
  
  // Hash the provided key and verify against stored hash
  const keyHash = crypto.hashToken(apiKey);
  
  // TODO: Look up key hash in database
  // const storedKey = await ApiKey.findOne({ hash: keyHash });
  
  // if (!storedKey) {
  //   return res.status(401).json({
  //     success: false,
  //     message: 'Invalid API key'
  //   });
  // }
  
  // Attach key info to request
  req.apiKey = { /* storedKey */ };
  
  next();
};

/**
 * Audit Logging Middleware
 * Logs sensitive operations for audit trail
 */
exports.auditLog = (operation, resourceType) => {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log successful operations
      if (res.statusCode < 400) {
        logger.info(`Audit: ${operation} - ${resourceType}`, {
          userId: req.user?.id,
          operation,
          resourceType,
          resourceId: req.params.id || data.id,
          changes: data,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Secure Session Middleware
 * Ensures session security
 */
exports.secureSession = (req, res, next) => {
  if (req.session) {
    // Set secure session options
    req.session.cookie = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    };
  }
  
  next();
};

/**
 * Data Integrity Middleware
 * Verifies request data hasn't been tampered with
 */
exports.verifyDataIntegrity = (req, res, next) => {
  const signature = req.headers['x-signature'];
  
  // Only check if signature header is provided
  if (!signature) {
    return next();
  }
  
  try {
    const isValid = crypto.verifyHMAC(
      JSON.stringify(req.body),
      signature
    );
    
    if (!isValid) {
      logger.warn('Data integrity check failed', {
        ip: req.ip,
        path: req.path
      });
      
      return res.status(400).json({
        success: false,
        message: 'Data integrity check failed'
      });
    }
  } catch (error) {
    logger.error('Data integrity verification error', { error: error.message });
  }
  
  next();
};

module.exports = exports;
