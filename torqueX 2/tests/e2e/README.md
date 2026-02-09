# End-to-End (E2E) Testing with Puppeteer

This directory contains end-to-end tests using Puppeteer and Jest to test the complete application workflow through a real browser.

## Overview

E2E tests validate the entire application stack:
- Frontend (EJS templates, Alpine.js, Tailwind CSS)
- Backend (Express.js, routes, controllers)
- Database (Prisma + PostgreSQL)
- Authentication (Clerk + fallback auth)
- Real browser interactions

## Test Structure

```
tests/e2e/
├── setup.js          # Global setup and helper functions
├── homepage.test.js  # Homepage navigation and responsiveness
├── vehicles.test.js  # Vehicle listings, filtering, details
├── auth.test.js      # Login, signup, logout, protected routes
└── booking.test.js   # Booking flow and payment integration
```

## Running E2E Tests

### Headless Mode (Default)
```bash
npm run test:e2e
```

### Headed Mode (Visible Browser)
```bash
npm run test:e2e:headed
```

### Run All Tests (Unit + Integration + E2E)
```bash
npm run test:all
```

## Configuration

### Jest Configuration
- **Config file**: `jest-e2e.config.js`
- **Preset**: `jest-puppeteer`
- **Timeout**: 30 seconds per test
- **Test match**: `**/tests/e2e/**/*.test.js`

### Puppeteer Configuration
- **Config file**: `jest-puppeteer.config.js`
- **Browser**: Headless Chrome
- **Viewport**: 1280x720
- **Server**: Auto-starts on port 3000
- **Launch timeout**: 30 seconds

## Test Coverage

### Homepage Tests (`homepage.test.js`)
- ✓ Page load and content validation
- ✓ Navigation links functionality
- ✓ Responsive design (mobile, tablet, desktop)
- ✓ Performance (page load time < 5s)

### Vehicle Tests (`vehicles.test.js`)
- ✓ Vehicle listings display
- Vehicle filtering by type
- Vehicle detail page navigation
- Search functionality
- Pagination handling

### Authentication Tests (`auth.test.js`)
- Login page form validation
- Signup page form validation
- Invalid credentials error handling
- Logout functionality
- Protected route access control

### Booking Tests (`booking.test.js`)
- Booking form navigation
- Date validation
- Price calculation
- Payment integration
- Confirmation flow

## Current Test Results

```
Test Suites: 1 passed, 3 failed, 4 total
Tests:       30 passed, 16 failed, 46 total
Time:        ~47 seconds
```

**Note**: Some tests are failing due to selector mismatches with the actual DOM structure. These will be fixed as the application evolves.

## Helper Functions

Available in `setup.js`:

### `waitForSelector(selector, timeout)`
Wait for an element to appear on the page.
```javascript
await waitForSelector('.vehicle-card', 10000);
```

### `clickAndWait(selector, waitTime)`
Click an element and wait for a specified time.
```javascript
await clickAndWait('#submit-button', 2000);
```

### `typeAndSubmit(inputSelector, value, submitSelector)`
Type into an input field and submit the form.
```javascript
await typeAndSubmit('#email', 'test@example.com', '#login-button');
```

### `getInnerText(selector)`
Get the text content of an element.
```javascript
const title = await getInnerText('h1');
```

## Debugging E2E Tests

### View Browser Actions
Run in headed mode to see browser actions:
```bash
npm run test:e2e:headed
```

### Check Browser Console
The setup automatically logs browser console messages and errors to the test output.

### Increase Timeout
For slow operations, increase the timeout in the test:
```javascript
it('slow test', async () => {
  // ...
}, 60000); // 60 second timeout
```

### Take Screenshots
Add screenshot capture for debugging:
```javascript
await page.screenshot({ path: 'debug.png' });
```

## Common Issues

### Port 3000 Already in Use
```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill -9

# Then run tests again
npm run test:e2e
```

### Element Not Found
- Check if the selector matches the actual DOM
- Use browser DevTools to inspect elements
- Wait for elements to load: `await page.waitForSelector(selector)`

### Timeout Errors
- Increase test timeout in `jest-e2e.config.js`
- Check if the server is starting correctly
- Verify database connection

### CSP (Content Security Policy) Errors
Some external scripts (like Clerk) may be blocked by CSP in test environment. This is expected and doesn't affect the test results for most tests.

## Best Practices

### 1. Test Isolation
Each test gets a fresh page instance. Don't rely on state from previous tests.

### 2. Wait for Elements
Always wait for elements before interacting:
```javascript
await page.waitForSelector('#my-element');
await page.click('#my-element');
```

### 3. Use Descriptive Selectors
Prefer data attributes or IDs over class names:
```javascript
// Good
await page.$('[data-testid="vehicle-card"]');

// Avoid
await page.$('.card.vehicle.item');
```

### 4. Test Real User Flows
Focus on complete workflows, not individual functions:
```javascript
// Good - tests complete flow
it('should complete booking process', async () => {
  await page.goto('http://localhost:3000/vehicles');
  await page.click('.vehicle-card:first-child');
  await page.click('#book-now');
  // ... complete booking
});
```

### 5. Clean Up After Tests
Tests automatically close their pages, but clean up any created data if needed.

## Environment Variables

E2E tests use the same environment variables as the main application:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string (optional)
- `CLERK_PUBLISHABLE_KEY` - Clerk authentication (optional)
- `ENCRYPTION_KEY` - For password hashing

## CI/CD Integration

To run E2E tests in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    REDIS_URL: ${{ secrets.REDIS_URL }}
```

## Next Steps

- [ ] Fix failing tests by updating selectors
- [ ] Add more test coverage for critical paths
- [ ] Integrate with CI/CD pipeline
- [ ] Add visual regression testing
- [ ] Test email notifications
- [ ] Test WebSocket connections
- [ ] Add performance benchmarks
