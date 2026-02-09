/**
 * Error Testing Routes
 * Routes to test various error handling scenarios
 */

const express = require('express');
const router = express.Router();
const { getRedisClient } = require('../utils/redis');

// Test hello endpoint
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from TorqueX API' });
});

// Test Redis status
router.get('/redis-status', async (req, res) => {
  try {
    const redisClient = getRedisClient();
    
    if (!redisClient) {
      return res.json({
        status: 'disconnected',
        message: 'Redis client not initialized',
        integrated: true,
        connected: false
      });
    }

    const isReady = redisClient.isReady;
    const isOpen = redisClient.isOpen;
    
    // Try to ping Redis
    let pingResponse = null;
    let keys = [];
    if (isReady) {
      try {
        pingResponse = await redisClient.ping();
        keys = await redisClient.keys('*');
      } catch (error) {
        pingResponse = `Error: ${error.message}`;
      }
    }

    res.json({
      status: isReady ? 'connected' : 'disconnected',
      integrated: true,
      connected: isReady,
      isReady: isReady,
      isOpen: isOpen,
      ping: pingResponse,
      keys: keys,
      success: isReady,
      message: isReady ? 'Redis is integrated and connected' : 'Redis is integrated but not connected'
    });
  } catch (error) {
    res.json({
      status: 'error',
      integrated: true,
      connected: false,
      error: error.message,
      message: 'Redis is integrated but encountered an error'
    });
  }
});

// Test 404 error
router.get('/test-404', (req, res) => {
  const err = new Error('Test 404 Error');
  err.status = 404;
  throw err;
});

// Test 500 error
router.get('/test-500', (req, res) => {
  throw new Error('Test 500 Error');
});

// Test controller error handling
router.get('/test-controller-error', (req, res) => {
  try {
    // Intentionally cause an error
    const nonExistentObject = undefined;
    nonExistentObject.someProperty;
  } catch (error) {
    console.error('Test controller error:', error);
    res.status(500).render('error', { 
      message: 'Test controller error',
      error: req.app.get('env') === 'development' ? error : {}
      // Intentionally omit title to test fallback
    });
  }
});

module.exports = router;