/**
 * Redis Client Configuration and Utilities
 * Provides Redis connection, caching, and session management
 */

const { createClient } = require('redis');
const logger = require('./logger');

// Redis client instance
let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis client
 */
const initRedis = async () => {
  // Skip Redis if not configured
  if (!process.env.REDIS_HOST) {
    logger.info('Redis: Skipping initialization (REDIS_HOST not configured)');
    return null;
  }
  
  // Return existing client if already initialized
  if (redisClient && isConnected) {
    logger.info('Redis: Using existing connection');
    return redisClient;
  }
  
  try {
    // Create Redis client with credentials
    redisClient = createClient({
      username: process.env.REDIS_USERNAME || 'default',
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '11311'),
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          // Exponential backoff: 50ms, 100ms, 200ms, etc.
          return Math.min(retries * 50, 3000);
        }
      },
      // Add timeouts
      pingInterval: 1000,
      connectTimeout: 10000
    });

    // Error handler
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      isConnected = false;
    });

    // Connection handler
    redisClient.on('connect', () => {
      logger.info('Redis: Connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis: Connected and ready');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis: Reconnecting...');
      isConnected = false;
    });

    redisClient.on('end', () => {
      logger.warn('Redis: Connection ended');
      isConnected = false;
    });

    // Connect to Redis
    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    logger.info('Redis: Connection successful');
    
    return redisClient;
  } catch (error) {
    logger.error('Redis: Failed to initialize', error);
    throw error;
  }
};

/**
 * Get Redis client instance
 */
const getRedisClient = () => {
  if (!redisClient || !isConnected) {
    logger.warn('Redis client not initialized or not connected');
    return null;
  }
  return redisClient;
};

/**
 * Check if Redis is connected
 */
const isRedisConnected = () => isConnected;

/**
 * Cache utilities
 */

/**
 * Set cache with expiration
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
const setCache = async (key, value, ttl = 300) => {
  try {
    console.log(`[DEBUG] setCache called: key=${key}, isConnected=${isConnected}`);
    if (!isConnected) {
      logger.warn('Redis not connected, skipping cache set');
      return false;
    }
    
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await redisClient.setEx(key, ttl, stringValue);
    console.log(`[DEBUG] Cache set successfully: ${key}`);
    return true;
  } catch (error) {
    logger.error(`Redis: Error setting cache for key ${key}`, error);
    return false;
  }
};

/**
 * Get cache value
 * @param {string} key - Cache key
 * @returns {any} Parsed value or null if not found
 */
const getCache = async (key) => {
  try {
    if (!isConnected) {
      logger.warn('Redis not connected, skipping cache get');
      return null;
    }
    
    const value = await redisClient.get(key);
    if (!value) return null;
    
    // Try to parse as JSON, return raw string if it fails
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    logger.error(`Redis: Error getting cache for key ${key}`, error);
    return null;
  }
};

/**
 * Delete cache key
 * @param {string} key - Cache key
 */
const deleteCache = async (key) => {
  try {
    if (!isConnected) return false;
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Redis: Error deleting cache for key ${key}`, error);
    return false;
  }
};

/**
 * Delete multiple cache keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., "vehicles:*")
 */
const deleteCachePattern = async (pattern) => {
  try {
    if (!isConnected) return false;
    
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    logger.error(`Redis: Error deleting cache pattern ${pattern}`, error);
    return false;
  }
};

/**
 * Rate limiting utilities
 */

/**
 * Check and increment rate limit
 * @param {string} key - Rate limit key (e.g., IP address)
 * @param {number} limit - Maximum requests allowed
 * @param {number} window - Time window in seconds
 * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
 */
const checkRateLimit = async (key, limit = 100, window = 60) => {
  try {
    if (!isConnected) {
      // If Redis is down, allow the request (fail open)
      return { allowed: true, remaining: limit, resetTime: Date.now() + window * 1000 };
    }
    
    const rateLimitKey = `ratelimit:${key}`;
    const current = await redisClient.get(rateLimitKey);
    
    if (!current) {
      // First request in window
      await redisClient.setEx(rateLimitKey, window, '1');
      return { 
        allowed: true, 
        remaining: limit - 1, 
        resetTime: Date.now() + window * 1000 
      };
    }
    
    const count = parseInt(current);
    
    if (count >= limit) {
      const ttl = await redisClient.ttl(rateLimitKey);
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: Date.now() + ttl * 1000 
      };
    }
    
    // Increment counter
    await redisClient.incr(rateLimitKey);
    const ttl = await redisClient.ttl(rateLimitKey);
    
    return { 
      allowed: true, 
      remaining: limit - count - 1, 
      resetTime: Date.now() + ttl * 1000 
    };
  } catch (error) {
    logger.error('Redis: Rate limit check error', error);
    // Fail open - allow request if Redis is having issues
    return { allowed: true, remaining: limit, resetTime: Date.now() + window * 1000 };
  }
};

/**
 * Clear rate limit for a key
 * @param {string} key - Rate limit key
 */
const clearRateLimit = async (key) => {
  try {
    if (!isConnected) return false;
    await redisClient.del(`ratelimit:${key}`);
    return true;
  } catch (error) {
    logger.error('Redis: Error clearing rate limit', error);
    return false;
  }
};

/**
 * Session utilities (for connect-redis)
 */

/**
 * Get session count
 */
const getSessionCount = async () => {
  try {
    if (!isConnected) return 0;
    const keys = await redisClient.keys('sess:*');
    return keys.length;
  } catch (error) {
    logger.error('Redis: Error getting session count', error);
    return 0;
  }
};

/**
 * Close Redis connection
 */
const closeRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      isConnected = false;
      logger.info('Redis: Connection closed');
    }
  } catch (error) {
    logger.error('Redis: Error closing connection', error);
  }
};

// Cache key builders (for consistency)
const CacheKeys = {
  vehicles: {
    all: 'vehicles:all',
    byId: (id) => `vehicles:${id}`,
    byType: (type) => `vehicles:type:${type}`,
    available: 'vehicles:available'
  },
  deals: {
    all: 'deals:all',
    active: 'deals:active',
    byId: (id) => `deals:${id}`,
    byCode: (code) => `deals:code:${code}`
  },
  stats: {
    dashboard: 'stats:dashboard',
    revenue: 'stats:revenue',
    bookings: 'stats:bookings'
  },
  user: {
    byId: (id) => `user:${id}`,
    bookings: (id) => `user:${id}:bookings`
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  isRedisConnected,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  checkRateLimit,
  clearRateLimit,
  getSessionCount,
  closeRedis,
  CacheKeys
};
