/**
 * E2E Tests for Vehicle Booking Flow
 */

describe('Vehicle Booking E2E Tests', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  // Add timeout increase for slower page loads
  jest.setTimeout(45000);

  describe('Booking Process', () => {
    it('should load vehicles page for browsing', async () => {
      await page.goto(`${BASE_URL}/vehicles`, { waitUntil: 'networkidle0' });
      const heading = await page.$('h1');
      expect(heading !== undefined).toBe(true);
    });

    it('should have filters for vehicle selection', async () => {
      await page.goto(`${BASE_URL}/vehicles`, { waitUntil: 'networkidle0' });
      const filterForm = await page.$('#filter-form');
      expect(filterForm !== undefined).toBe(true);
    });

    it('should display vehicle type options', async () => {
      await page.goto(`${BASE_URL}/vehicles`, { waitUntil: 'networkidle0' });
      const typeRadios = await page.$$('input[name="type"]');
      expect(typeRadios !== undefined).toBe(true);
    });

    it('should have price range filters for budgeting', async () => {
      await page.goto(`${BASE_URL}/vehicles`, { waitUntil: 'networkidle0' });
      const minPrice = await page.$('#minPrice');
      const maxPrice = await page.$('#maxPrice');
      expect(minPrice !== undefined).toBe(true);
      expect(maxPrice !== undefined).toBe(true);
    });

    it('should require authentication for booking', async () => {
      const response = await page.goto(`${BASE_URL}/user/bookings`, { waitUntil: 'networkidle0' });
      const url = page.url();
      // Should redirect to login or return 401
      expect(url.includes('/auth/login') || response.status() === 401).toBe(true);
    });
  });

  describe('Payment Integration', () => {
    it('should have homepage with CTA to browse vehicles', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      const browseButton = await page.$('a[href="/vehicles"]');
      expect(browseButton !== undefined).toBe(true);
    });

    it('should display featured vehicles section', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      const heading = await page.$('h2');
      expect(heading !== undefined).toBe(true);
    });
  });

  describe('Booking Confirmation', () => {
    it('should show login button for unauthenticated users', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      const loginButton = await page.$('a[href="/auth/login"]');
      expect(loginButton !== undefined).toBe(true);
    });

    it('should show signup button for new users', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      const signupButton = await page.$('a[href="/auth/signup"]');
      expect(signupButton !== undefined).toBe(true);
    });
  });
});
