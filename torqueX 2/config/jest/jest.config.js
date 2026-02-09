module.exports = {
  // Root directory for Jest
  rootDir: '../..',
  
  // Test environment
  testEnvironment: 'node',

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Patterns to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/prisma/',
    '/public/',
    '/tests/e2e/'
  ],

  // Coverage paths to ignore
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/prisma/',
    '/public/',
    '/bin/',
    '/scripts/'
  ],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Verbose output
  verbose: true,

  // Collect coverage from these files
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/views/**',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],

  // Transform files
  transform: {},

  // Module name mapper for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // Test timeout
  testTimeout: 10000
};
