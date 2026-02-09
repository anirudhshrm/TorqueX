const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing admin login and dashboard access...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    console.log('📝 Navigating to login page...');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForSelector('form');
    
    // Fill in admin credentials
    console.log('🔐 Filling in admin credentials...');
    await page.type('#email', 'admin@torquex.com');
    await page.type('#password', 'admin123');
    
    // Submit form
    console.log('✅ Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    const currentUrl = page.url();
    console.log('🔗 Redirected to:', currentUrl);
    
    if (currentUrl.includes('/admin/dashboard')) {
      console.log('✅ SUCCESS: Admin dashboard loaded successfully!');
      
      // Check for dashboard elements
      await page.waitForSelector('h1', { timeout: 5000 });
      const dashboardTitle = await page.$eval('h1', el => el.textContent);
      console.log('📊 Dashboard title:', dashboardTitle);
      
      // Check for stats
      const statsCards = await page.$$('.bg-white.rounded-lg.shadow.p-6');
      console.log('📈 Found', statsCards.length, 'stats cards');
      
      // Take a screenshot for verification
      await page.screenshot({ path: 'admin-dashboard-success.png' });
      console.log('📸 Screenshot saved as admin-dashboard-success.png');
      
    } else if (currentUrl.includes('/error')) {
      console.log('❌ ERROR: Redirected to error page');
      const errorMsg = await page.$eval('h1', el => el.textContent).catch(() => 'Unknown error');
      console.log('💥 Error message:', errorMsg);
      
      // Take a screenshot of the error
      await page.screenshot({ path: 'admin-dashboard-error.png' });
      console.log('📸 Error screenshot saved as admin-dashboard-error.png');
    } else {
      console.log('⚠️  UNEXPECTED: Redirected to unexpected page');
      
      // Check for any error messages
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('📄 Page content preview:', bodyText.substring(0, 500));
      
      await page.screenshot({ path: 'admin-dashboard-unexpected.png' });
      console.log('📸 Unexpected page screenshot saved');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    // Take a screenshot on error
    await page.screenshot({ path: 'admin-dashboard-failed.png' });
    console.log('📸 Failure screenshot saved');
    
    // Log console errors from the page
    const logs = await page.evaluate(() => {
      return window.console._logs || [];
    });
    console.log('🔍 Browser console logs:', logs);
  }
  
  await browser.close();
  console.log('🏁 Test completed');
})();