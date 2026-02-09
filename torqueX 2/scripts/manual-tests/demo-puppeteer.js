/**
 * Manual Puppeteer Demo - Take screenshots to verify pages load
 * Run with: node demo-puppeteer.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Launching browser...');
  
  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await puppeteer.launch({
    headless: false,  // Show browser window
    slowMo: 100,      // Slow down actions so you can see them
    devtools: false,  // Don't open devtools
    args: [
      '--window-size=1280,800',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--start-maximized'
    ],
    defaultViewport: null
  });

  const page = await browser.newPage();
  
  // Set user agent to look like a real browser
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  // Set extra HTTP headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
  });

  // Don't log console messages to keep output clean
  // page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  // page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    // First, test with a simple HTML page
    console.log('🧪 Testing with static HTML page first...');
    await page.goto('http://localhost:3000/test-screenshot.html', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const testHtml = await page.content();
    fs.writeFileSync(path.join(screenshotsDir, '0-test-page.html'), testHtml);
    await page.screenshot({ path: path.join(screenshotsDir, '0-test-page.png'), fullPage: true });
    console.log('✅ Test page screenshot saved!');
    console.log('');
    
    console.log('📄 Navigating to login page...');
    await page.goto('http://localhost:3000/auth/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    // Wait for body to be rendered
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Login page loaded!');
    
    // Fill in login form
    console.log('🔐 Filling in admin credentials...');
    
    // Get CSRF token from the form
    const csrfToken = await page.$eval('input[name="_csrf"]', el => el.value);
    console.log('🔑 CSRF token extracted');
    
    await page.type('#email', 'admin@torquex.com');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.type('#password', 'admin123');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🖱️  Clicking login button...');
    
    // Click and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
      page.click('button[type="submit"]')
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Logged in! Current URL:', page.url());
    
    // Save HTML for debugging
    const html = await page.content();
    fs.writeFileSync(path.join(screenshotsDir, '1-login-page.html'), html);
    
    await page.screenshot({ path: path.join(screenshotsDir, '1-login-page.png'), fullPage: true });
    console.log('📸 Screenshot saved: screenshots/1-login-page.png');
    
    // Navigate to admin dashboard
    console.log('📊 Navigating to admin dashboard...');
    await page.goto('http://localhost:3000/admin', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Admin dashboard loaded!');
    await page.screenshot({ path: path.join(screenshotsDir, '2-admin-dashboard.png'), fullPage: true });
    console.log('📸 Screenshot saved: screenshots/2-admin-dashboard.png');

    console.log('📄 Navigating to signup page...');
    await page.goto('http://localhost:3000/auth/signup', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Signup page loaded!');
    await page.screenshot({ path: path.join(screenshotsDir, '3-signup-page.png'), fullPage: true });
    console.log('📸 Screenshot saved: screenshots/3-signup-page.png');

    console.log('📄 Navigating to vehicles page...');
    await page.goto('http://localhost:3000/vehicles', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Vehicles page loaded!');
    await page.screenshot({ path: path.join(screenshotsDir, '4-vehicles-page.png'), fullPage: true });
    console.log('📸 Screenshot saved: screenshots/4-vehicles-page.png');

    console.log('🏠 Navigating to homepage...');
    await page.goto('http://localhost:3000/', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    await page.waitForSelector('body', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Homepage loaded!');
    await page.screenshot({ path: path.join(screenshotsDir, '5-homepage.png'), fullPage: true });
    console.log('📸 Screenshot saved: screenshots/5-homepage.png');

    console.log('\n✨ All screenshots saved to screenshots/ folder!');
    console.log('📂 Check the screenshots folder to see what Puppeteer sees.');
    
    // Keep browser open for 5 more seconds so you can see the final page
    console.log('\n⏳ Keeping browser open for 5 more seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png') });
  } finally {
    console.log('👋 Closing browser...');
    await browser.close();
    console.log('\n✅ Done! Check the screenshots/ folder.');
  }
})();
