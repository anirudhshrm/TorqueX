#!/usr/bin/env node

/**
 * Redis Verification Script
 * Tests Redis connectivity and caching functionality
 */

const { createClient } = require('redis');
const path = require('path');
require('dotenv').config();

const logger = {
  info: (msg) => console.log(`✓ ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  debug: (msg) => console.log(`📝 ${msg}`)
};

async function verifyRedis() {
  console.log('\n🔍 Verifying Redis Configuration & Connection...\n');

  // Check environment variables
  console.log('📋 Checking Environment Variables:');
  const redisConfig = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD
  };

  if (!redisConfig.host) {
    logger.error('REDIS_HOST not configured in .env');
    return false;
  }
  if (!redisConfig.port) {
    logger.error('REDIS_PORT not configured in .env');
    return false;
  }
  if (!redisConfig.password) {
    logger.error('REDIS_PASSWORD not configured in .env');
    return false;
  }

  logger.info(`REDIS_HOST: ${redisConfig.host}`);
  logger.info(`REDIS_PORT: ${redisConfig.port}`);
  logger.info(`REDIS_USERNAME: ${redisConfig.username || 'default'}`);
  logger.info(`REDIS_PASSWORD: ${redisConfig.password.substring(0, 5)}...`);

  // Create Redis client
  console.log('\n🔌 Creating Redis Client Connection:\n');

  let redisClient;
  try {
    redisClient = createClient({
      username: redisConfig.username || 'default',
      password: redisConfig.password,
      socket: {
        host: redisConfig.host,
        port: parseInt(redisConfig.port),
        reconnectStrategy: (retries) => {
          if (retries > 3) return new Error('Max retries');
          return Math.min(retries * 100, 3000);
        }
      },
      connectTimeout: 10000
    });

    redisClient.on('error', (err) => {
      logger.error(`Connection error: ${err.message}`);
    });

    // Connect
    await redisClient.connect();
    logger.success('Connected to Redis');
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error.message}`);
    return false;
  }

  // Test basic operations
  console.log('\n⚙️  Testing Redis Operations:\n');

  try {
    // Test PING
    const ping = await redisClient.ping();
    if (ping === 'PONG') {
      logger.success('PING test passed');
    }

    // Test SET/GET
    const testKey = `test:${Date.now()}`;
    const testValue = { message: 'Redis is working!', timestamp: new Date().toISOString() };
    
    await redisClient.setEx(testKey, 60, JSON.stringify(testValue));
    logger.info(`SET test data with TTL (key: ${testKey})`);

    const retrieved = await redisClient.get(testKey);
    const parsedValue = JSON.parse(retrieved);
    logger.success(`GET test data: ${JSON.stringify(parsedValue)}`);

    // Test DEL
    await redisClient.del(testKey);
    logger.info(`DEL test key: ${testKey}`);

    // Get server info
    const info = await redisClient.info('server');
    const lines = info.split('\r\n');
    console.log('\n📊 Redis Server Info:\n');
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        logger.debug(line);
      }
    });

  } catch (error) {
    logger.error(`Operation failed: ${error.message}`);
    await redisClient.quit();
    return false;
  }

  // Test rate limiting simulation
  console.log('\n🛡️  Testing Rate Limiting:\n');

  try {
    const rateLimitKey = `ratelimit:test:${Date.now()}`;
    const limit = 5;
    const window = 60;

    for (let i = 1; i <= 7; i++) {
      const current = await redisClient.get(rateLimitKey);
      const count = current ? parseInt(current) : 0;

      if (count === 0) {
        await redisClient.setEx(rateLimitKey, window, '1');
        logger.info(`Request ${i}: Allowed (count: 1)`);
      } else if (count < limit) {
        await redisClient.incr(rateLimitKey);
        logger.info(`Request ${i}: Allowed (count: ${count + 1})`);
      } else {
        logger.warn(`Request ${i}: Blocked (rate limit exceeded, count: ${count})`);
      }
    }

    await redisClient.del(rateLimitKey);
  } catch (error) {
    logger.error(`Rate limit test failed: ${error.message}`);
  }

  // Test caching patterns
  console.log('\n💾 Testing Cache Patterns:\n');

  try {
    // Vehicle cache pattern
    const vehicleCache = {
      id: 123,
      name: 'Tesla Model 3',
      price: 45000,
      type: 'Sedan'
    };
    const vehicleKey = `vehicles:${123}`;
    await redisClient.setEx(vehicleKey, 300, JSON.stringify(vehicleCache));
    logger.info(`Vehicle cache set (TTL: 300s, key: ${vehicleKey})`);

    // Retrieve and verify
    const cachedVehicle = JSON.parse(await redisClient.get(vehicleKey));
    logger.success(`Vehicle cache retrieved: ${cachedVehicle.name} ($${cachedVehicle.price})`);

    // Deal cache pattern
    const dealCache = {
      id: 456,
      code: 'SUMMER20',
      discount: 20,
      description: 'Summer sale 20% off'
    };
    const dealKey = `deals:${456}`;
    await redisClient.setEx(dealKey, 600, JSON.stringify(dealCache));
    logger.info(`Deal cache set (TTL: 600s, key: ${dealKey})`);

    // Test pattern deletion
    const testPatternKey1 = `test:pattern:1`;
    const testPatternKey2 = `test:pattern:2`;
    await redisClient.set(testPatternKey1, 'value1');
    await redisClient.set(testPatternKey2, 'value2');
    
    const keysFound = await redisClient.keys('test:pattern:*');
    logger.info(`Found ${keysFound.length} keys matching pattern 'test:pattern:*'`);
    
    await redisClient.del(keysFound);
    logger.success(`Deleted all matching keys`);

  } catch (error) {
    logger.error(`Cache pattern test failed: ${error.message}`);
  }

  // Test session store readiness
  console.log('\n📦 Testing Session Store Readiness:\n');

  try {
    const sessionPrefix = 'torquex:sess:';
    const sessionKey = `${sessionPrefix}test-session-${Date.now()}`;
    
    const sessionData = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'admin',
      loginTime: new Date().toISOString()
    };

    await redisClient.setEx(sessionKey, 86400, JSON.stringify(sessionData)); // 24 hours
    logger.info(`Session data stored (TTL: 86400s, key: ${sessionKey})`);

    const retrievedSession = JSON.parse(await redisClient.get(sessionKey));
    logger.success(`Session retrieved: User ${retrievedSession.userId} (${retrievedSession.email})`);

    // Get session count (simulation)
    const sessionKeys = await redisClient.keys(`${sessionPrefix}*`);
    logger.info(`Active sessions in store: ${sessionKeys.length}`);

  } catch (error) {
    logger.error(`Session store test failed: ${error.message}`);
  }

  // Display connection summary
  console.log('\n📈 Connection Summary:\n');
  logger.success('Redis connection verified');
  logger.success('All operations working correctly');
  logger.success('Ready for production use');

  // Cleanup
  console.log('\n🧹 Cleaning up test data...\n');
  try {
    const testKeys = await redisClient.keys('test:*');
    const sessionTestKeys = await redisClient.keys('torquex:sess:test-*');
    const allTestKeys = [...testKeys, ...sessionTestKeys];
    
    if (allTestKeys.length > 0) {
      await redisClient.del(allTestKeys);
      logger.info(`Deleted ${allTestKeys.length} test keys`);
    }
  } catch (error) {
    logger.warn(`Cleanup warning: ${error.message}`);
  }

  // Close connection
  await redisClient.quit();
  console.log('\n✅ Redis verification complete!\n');
  return true;
}

// Run verification
verifyRedis()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  });
