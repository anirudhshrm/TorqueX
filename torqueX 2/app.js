require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { PrismaClient } = require('@prisma/client');
const { createClerkClient, ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const flash = require('connect-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const RedisStore = require('connect-redis').default;

// Import Redis utilities
const { initRedis, getRedisClient } = require('./src/utils/redis');

// Import security middleware
const securityMiddleware = require('./src/middleware/securityMiddleware');

// Import routes
const indexRouter = require('./src/routes/indexRoutes');
const authRouter = require('./src/routes/authRoutes');
const vehicleRouter = require('./src/routes/vehicleRoutes');
const bookingRouter = require('./src/routes/bookingRoutes');
const reviewRouter = require('./src/routes/reviewRoutes');
const adminRouter = require('./src/routes/adminRoutes');
const dealRouter = require('./src/routes/dealRoutes');
const testRouter = require('./src/routes/testRoutes');
const userRouter = require('./src/routes/userRoutes');
const webhookRouter = require('./src/routes/webhookRoutes');

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Clerk
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const app = express();

// Trust proxy - required for Railway/Heroku/other proxies
app.set('trust proxy', 1);

// view engine setup
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'ejs');

// ===== Security Middleware (apply first for maximum protection) =====
app.use(securityMiddleware.securityHeaders);           // Set security headers
app.use(securityMiddleware.preventSQLInjection);       // Prevent SQL injection
app.use(securityMiddleware.requestLogging);            // Log all requests

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method')); // Add support for PUT/DELETE in forms
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Redis and Session store
let redisClient;
(async () => {
  try {
    console.log('[INFO] Initializing Redis connection...');
    redisClient = await initRedis();
    console.log('[INFO] Redis initialized successfully');
  } catch (error) {
    console.error('[ERROR] Failed to initialize Redis:', error.message);
    console.warn('[WARN] Application will continue with in-memory session store');
  }
})();

// Session and flash middleware
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'torquex-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Use Redis store if available, otherwise fall back to in-memory
if (redisClient) {
  sessionConfig.store = new RedisStore({
    client: redisClient,
    prefix: 'torquex:sess:',
    ttl: 24 * 60 * 60 // 24 hours in seconds
  });
}

app.use(session(sessionConfig));
app.use(flash());

// ===== Additional Security Middleware =====
app.use(securityMiddleware.sanitizeInput);             // Sanitize user input
app.use(securityMiddleware.csrfProtection);            // CSRF protection
app.use(securityMiddleware.verifyDataIntegrity);       // Verify data integrity

// Make Prisma and Clerk available in all routes
app.use((req, res, next) => {
  req.prisma = prisma;
  req.clerk = clerk;
  
  // Add flash messages to response locals
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  
  // Make Clerk publishable key available to all views
  res.locals.clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY || '';
  
  next();
});

// Add Clerk authentication to all routes
// Allow fallback to manual auth if Clerk is unavailable or disabled
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isPuppeteer = userAgent.includes('HeadlessChrome') || userAgent.includes('Chrome/120.0.0.0');
  const hasManualSession = req.session && req.session.manualAuth && req.session.userId;
  
  // Allow static files and test pages through without Clerk
  if (req.path.startsWith('/stylesheets') || 
      req.path.startsWith('/javascripts') || 
      req.path.startsWith('/images') || 
      req.path.startsWith('/test-screenshot')) {
    return next();
  }
  
  // Skip Clerk for: Puppeteer, users with manual auth session, or if SKIP_CLERK env is set
  if (isPuppeteer || hasManualSession || process.env.SKIP_CLERK === 'true') {
    return next();
  }
  
  // Normal requests go through Clerk
  return ClerkExpressWithAuth()(req, res, next);
});

// Add populateUser middleware to add user to all requests
const { populateUser } = require('./src/middleware/authMiddleware');
app.use(populateUser);

// Routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/vehicles', vehicleRouter);
app.use('/bookings', bookingRouter);
app.use('/reviews', reviewRouter);
app.use('/admin', adminRouter);
app.use('/deals', dealRouter);
app.use('/test', testRouter);
app.use('/user', userRouter);
app.use('/webhooks', webhookRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', { 
    title: 'Error',
    user: req.user || null
  });
});

module.exports = app;