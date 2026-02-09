# TorqueX Testing Guide

## Overview
This project uses **Jest** for testing. Tests are organized into unit tests and integration tests.

## Test Structure

```
tests/
├── setup.js                    # Jest setup and global mocks
├── unit/                       # Unit tests
│   ├── crypto.test.js         # Crypto utilities tests
│   └── validators.test.js     # Validation functions tests
└── integration/                # Integration tests
    ├── auth.test.js           # Authentication routes tests
    └── vehicles.test.js       # Vehicle API tests
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests with verbose output
```bash
npm run test:verbose
```

### Run specific test file
```bash
npm test -- crypto.test.js
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="should hash password"
```

## Test Coverage

Coverage thresholds are set to 70% for:
- Branches
- Functions
- Lines
- Statements

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Writing Tests

### Unit Test Example
```javascript
describe('Function Name', () => {
  it('should do something specific', () => {
    const result = functionToTest();
    expect(result).toBe(expectedValue);
  });
});
```

### Integration Test Example
```javascript
describe('API Endpoint', () => {
  it('should return 200 status', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

## Mocking

### Redis is automatically mocked
The `setup.js` file mocks Redis to prevent connection issues during testing.

### Mocking Prisma
```javascript
req.prisma = {
  user: {
    findUnique: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockResolvedValue(newUser)
  }
};
```

### Mocking Express Request/Response
```javascript
const mockReq = {
  body: {},
  params: {},
  query: {}
};

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
  render: jest.fn()
};
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Descriptions**: Use descriptive test names
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Database, APIs, Redis, etc.
5. **Test Edge Cases**: Not just happy paths
6. **Keep Tests Fast**: Mock slow operations
7. **Maintain Coverage**: Aim for 70%+ coverage

## Common Commands

```bash
# Install dependencies
npm install

# Run tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test crypto.test.js

# Run tests matching pattern
npm test -- --testNamePattern="encrypt"

# Update snapshots
npm test -- -u

# Run tests in CI mode
CI=true npm test
```

## Test Environment

- **Environment**: Node.js
- **Test Framework**: Jest
- **HTTP Testing**: Supertest
- **Mocking**: Jest mocks
- **Coverage Tool**: Jest built-in

## Continuous Integration

Tests should run automatically on:
- Pre-commit (optional)
- Pull requests
- Main branch pushes

## Debugging Tests

### Run in debug mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Use Chrome DevTools
1. Run the debug command above
2. Open `chrome://inspect` in Chrome
3. Click "inspect" on the Jest process

### Add debugging statements
```javascript
console.log('Debug info:', variable);
debugger; // Breakpoint when debugging
```

## Test Data

For integration tests, use:
- Mock data in test files
- Test fixtures in `tests/fixtures/`
- Factory functions for creating test objects

## Coverage Goals

| Type | Threshold |
|------|-----------|
| Statements | 70% |
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |

Current coverage can be viewed in the coverage report after running:
```bash
npm run test:coverage
```

## Troubleshooting

### Tests timing out
- Increase timeout in `jest.config.js`
- Check for unresolved promises
- Ensure async tests use `async/await`

### Mock not working
- Check mock is defined before importing module
- Use `jest.clearAllMocks()` in `beforeEach`
- Verify mock path is correct

### Database connection errors
- Ensure using test database
- Mock Prisma client properly
- Check DATABASE_URL in test environment

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
