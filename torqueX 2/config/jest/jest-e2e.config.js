const fs = require('fs');
const path = require('path');

// Ensure screenshots directory exists
const screenshotsDir = path.join(__dirname, '../../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

module.exports = {
  // Root directory for Jest
  rootDir: '../..',
  
  // Use Puppeteer preset for E2E tests
  preset: 'jest-puppeteer',

  // Use custom setup for E2E tests
  setupFilesAfterEnv: ['<rootDir>/tests/e2e/setup.js'],

  // Only run E2E tests
  testMatch: [
    '**/tests/e2e/**/*.test.js'
  ],

  // Patterns to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/tests/unit/',
    '/tests/integration/'
  ],

  // Test timeout configuration
  testTimeout: 120000, // 2 minutes for E2E tests
  
  // Verbose output
  verbose: true,

  // Test timeout (E2E tests take longer, admin workflows need more time)
  testTimeout: 120000,

  // Transform files
  transform: {},

  // Module name mapper for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
