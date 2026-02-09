// Jest setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
process.env.SESSION_SECRET = 'test-secret-key-for-testing-only';

// Mock Redis to avoid connection issues in tests
jest.mock('../src/utils/redis', () => ({
  initRedis: jest.fn().mockResolvedValue(null),
  getRedisClient: jest.fn().mockReturnValue(null),
  isRedisConnected: jest.fn().mockReturnValue(false),
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue('OK'),
  deleteCache: jest.fn().mockResolvedValue(1),
  deleteCachePattern: jest.fn().mockResolvedValue(1),
  checkRateLimit: jest.fn().mockResolvedValue({
    allowed: true,
    remaining: 99,
    resetTime: Date.now() + 900000
  }),
  clearRateLimit: jest.fn().mockResolvedValue(1),
  getSessionCount: jest.fn().mockResolvedValue(0),
  CacheKeys: {
    vehicles: jest.fn((filters) => `vehicles:list:${JSON.stringify(filters)}`),
    vehicle: jest.fn((id) => `vehicles:detail:${id}`),
    deals: jest.fn((filters) => `deals:list:${JSON.stringify(filters)}`),
    deal: jest.fn((id) => `deals:detail:${id}`),
    stats: jest.fn(() => 'stats:dashboard'),
    bookings: jest.fn((userId) => `bookings:user:${userId}`)
  }
}));

// Increase timeout for all tests
jest.setTimeout(10000);

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };
