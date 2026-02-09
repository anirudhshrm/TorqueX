/**
 * Auth Controller
 * Handles user authentication using Clerk
 */

const crypto = require('../utils/crypto');
const logger = require('../utils/logger');

// Login page controller
exports.getLoginPage = (req, res) => {
  // If user is already logged in, redirect to dashboard
  if (req.user) {
    return res.redirect('/user/dashboard');
  }
  
  res.render('auth/login', { 
    title: 'Login to TorqueX',
    user: null
  });
};

// Signup page controller
exports.getSignupPage = (req, res) => {
  // If user is already logged in, redirect to dashboard
  if (req.user) {
    return res.redirect('/user/dashboard');
  }
  
  res.render('auth/signup', { 
    title: 'Sign Up for TorqueX',
    user: null
  });
};

// Logout controller
exports.logout = (req, res) => {
  console.log('Handling logout request');
  
  // Handle fallback authentication logout
  if (req.session && req.session.manualAuth) {
    console.log('Logging out manual auth user');
    
    req.session.userId = null;
    req.session.userEmail = null;
    req.session.manualAuth = false;
    
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
      }
      
      req.flash('success', 'You have been logged out successfully.');
      res.redirect('/');
    });
    return;
  }
  
  // Clerk handles logout on client side
  // Here we just render a page that will trigger the Clerk logout
  console.log('Rendering Clerk logout page');
  res.render('auth/logout', {
    title: 'Logging Out',
    user: req.user || null
  });
};

// Callback for Clerk authentication
exports.handleAuthCallback = async (req, res) => {
  try {
    // Get auth data from either query (GET) or body (POST)
    const authData = req.method === 'POST' ? req.body : req.query;
    
          // Handle fallback form authentication (if Clerk fails to load)
    if (authData.email && authData.password) {
      console.log('Handling fallback authentication for email:', authData.email);
      
      // Find user by email
      const existingUser = await req.prisma.user.findFirst({
        where: {
          email: authData.email
        }
      });
      
      if (!existingUser) {
        // This is a sign up - create a new user
        try {
          // Generate a unique ID for manual authentication
          const manualClerkId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
          
          // Hash the password for secure storage
          const { hash: passwordHash, salt: passwordSalt } = await crypto.hashPassword(authData.password);
          
          logger.info('Creating new user account', { email: authData.email });
          
          const newUser = await req.prisma.user.create({
            data: {
              clerkId: manualClerkId,
              name: authData.name || authData.email.split('@')[0],
              email: authData.email,
              role: 'USER',
              // Store password hash and salt securely
              ...(authData.password && {
                passwordHash,
                passwordSalt
              })
            }
          });
          
          logger.info('User account created successfully', { 
            userId: newUser.id, 
            email: newUser.email 
          });
          
          // Simulate authentication by adding user to session
          req.session.userId = newUser.id;
          req.session.userEmail = newUser.email;
          req.session.manualAuth = true;
          
          // Save session explicitly and return immediately to prevent further execution
          return new Promise((resolve) => {
            req.session.save(err => {
              if (err) {
                logger.error('Session save error', { error: err.message });
              }
              req.flash('success', 'Account created successfully! Welcome to TorqueX.');
              res.redirect('/user/dashboard');
              resolve();
            });
          });
        } catch (error) {
          logger.error('User account creation failed', { error: error.message });
          req.flash('error', `Failed to create account: ${error.message}`);
          return res.redirect('/auth/signup');
        }
      } else {
        // This is a login - authenticate existing user
        try {
          // Verify password if it's a fallback authentication
          if (existingUser.passwordHash && existingUser.passwordSalt) {
            const isPasswordValid = await crypto.verifyPassword(
              authData.password,
              existingUser.passwordHash,
              existingUser.passwordSalt
            );
            
            if (!isPasswordValid) {
              logger.warn('Failed login attempt - invalid password', { email: authData.email });
              req.flash('error', 'Invalid email or password');
              return res.redirect('/auth/login');
            }
          } else {
            // User exists but has no password set - this shouldn't happen for fallback auth
            logger.warn('Login attempt for user without password', { email: authData.email });
            req.flash('error', 'Invalid email or password. Please contact support.');
            return res.redirect('/auth/login');
          }
          
          logger.info('User authenticated successfully', { 
            userId: existingUser.id,
            email: existingUser.email 
          });
          
          // Simulate authentication by adding user to session
          req.session.userId = existingUser.id;
          req.session.userEmail = existingUser.email;
          req.session.manualAuth = true;
          
          // Save session explicitly and return immediately to prevent further execution
          return new Promise((resolve) => {
            req.session.save(err => {
              if (err) {
                logger.error('Session save error', { error: err.message });
              }
              req.flash('success', 'Welcome back to TorqueX!');
              
              // Redirect based on user role
              if (existingUser.role === 'ADMIN') {
                res.redirect('/admin/dashboard');
              } else {
                res.redirect('/user/dashboard');
              }
              resolve();
            });
          });
        } catch (error) {
          logger.error('User authentication failed', { error: error.message });
          req.flash('error', 'Authentication failed. Please try again.');
          return res.redirect('/auth/login');
        }
      }
    }
    
    // Handle Clerk authentication
    if (!req.auth || !req.auth.userId) {
      req.flash('error', 'Authentication failed. Please try again.');
      return res.redirect('/auth/login');
    }
    
    const { userId } = req.auth;
    console.log('Handling Clerk authentication for userId:', userId);
    
    // Check if user exists in our database
    let user = await req.prisma.user.findUnique({
      where: { clerkId: userId }
    });
    
    // If user doesn't exist, create a new user
    if (!user) {
      try {
        const clerkUser = await req.clerk.users.getUser(userId);
        
        user = await req.prisma.user.create({
          data: {
            clerkId: userId,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'New User',
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            role: 'USER', // Default role
          }
        });
        
        req.flash('success', 'Account created successfully! Welcome to TorqueX.');
      } catch (error) {
        console.error('Error creating user from Clerk data:', error);
        req.flash('error', 'Failed to create your account. Please try again.');
        return res.redirect('/auth/login');
      }
    } else {
      req.flash('success', 'Welcome back to TorqueX!');
    }
    
    // Redirect based on user role
    if (user.role === 'ADMIN') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/user/dashboard');
    }
  } catch (error) {
    console.error('Auth callback error:', error);
    req.flash('error', 'Authentication error. Please try again.');
    res.redirect('/auth/login');
  }
};