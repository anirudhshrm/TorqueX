/**
 * Puppeteer test to verify admin booking status update with CSRF token
 */

const puppeteer = require('puppeteer');

const BOOKING_ID = '7bad47ed-b675-4ab2-a9aa-4c0ad8d5caee';
const BASE_URL = 'http://localhost:3000';

async function testBookingStatusUpdate() {
  let browser;
  
  try {
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      slowMo: 100,
      args: ['--window-size=1280,800']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Enable request interception to log requests
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('/admin/bookings') && request.method() === 'PUT') {
        console.log('\n📤 PUT Request detected:');
        console.log('   URL:', request.url());
        console.log('   Headers:', JSON.stringify(request.headers(), null, 2));
        console.log('   Body:', request.postData());
      }
      request.continue();
    });

    page.on('response', async (response) => {
      if (response.url().includes('/admin/bookings') && response.request().method() === 'PUT') {
        console.log('\n📥 PUT Response received:');
        console.log('   Status:', response.status(), response.statusText());
        try {
          const text = await response.text();
          console.log('   Body:', text);
        } catch (e) {
          console.log('   (Could not read response body)');
        }
      }
    });

    // Log console messages from the page
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('CSRF') || text.includes('csrf') || text.includes('status')) {
        console.log('🖥️  Browser Console:', text);
      }
    });

    console.log('\n1️⃣  Navigating to login page...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });

    // Check if we need to login (look for admin user in scripts)
    console.log('\n2️⃣  Logging in as admin...');
    
    // Fill in login credentials (using test admin if exists)
    await page.waitForSelector('input[name="email"]', { timeout: 5000 });
    await page.type('input[name="email"]', 'admin@torquex.com');
    await page.type('input[name="password"]', 'Admin@123');
    
    // Click login button
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });

    console.log('\n3️⃣  Navigating to admin bookings page...');
    await page.goto(`${BASE_URL}/admin/bookings`, { waitUntil: 'networkidle2' });

    // Wait for the page to load
    await page.waitForSelector('.status-select', { timeout: 5000 });

    console.log('\n4️⃣  Finding booking and changing status...');
    
    // Find the select dropdown for our booking
    const selectElement = await page.$(`select.status-select[data-booking-id="${BOOKING_ID}"]`);
    
    if (!selectElement) {
      console.error('❌ Could not find booking select element');
      return;
    }

    // Change the status to CONFIRMED
    console.log(`   Changing booking ${BOOKING_ID.substring(0, 8)}... to CONFIRMED`);
    await page.select(`select.status-select[data-booking-id="${BOOKING_ID}"]`, 'CONFIRMED');

    // Wait for the fetch request to complete
    await page.waitForTimeout(2000);

    console.log('\n✅ Test completed! Check the logs above for CSRF validation.');
    console.log('   If you see status 200 and no CSRF errors, the fix worked!');

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    console.error(error);
  } finally {
    if (browser) {
      console.log('\n👋 Closing browser...');
      await browser.close();
    }
  }
}

// Check if admin exists first
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.user.findFirst({
      where: { 
        email: 'admin@torquex.com',
        role: 'ADMIN'
      }
    });

    if (!admin) {
      console.log('⚠️  No admin user found. Creating admin account...');
      console.log('   Run: node scripts/create-admin.js');
      console.log('   Or use existing admin credentials');
      process.exit(1);
    }

    console.log('✅ Admin user found:', admin.email);
    await prisma.$disconnect();
    
    // Run the test
    await testBookingStatusUpdate();
    
  } catch (error) {
    console.error('Error checking admin:', error);
    process.exit(1);
  }
}

checkAdmin();
