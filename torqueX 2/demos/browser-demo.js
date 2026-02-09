/**
 * Simple standalone browser automation demo
 */
const puppeteer = require('puppeteer');

async function runDemo() {
  console.log('🚀 Starting browser demo...');
  
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 250, // Much faster - 0.25 second delay
    devtools: false, // Disable devtools for cleaner view
    args: [
      '--window-size=1440,900',
    '--window-position=80,60',
    '--no-sandbox',
    '--disable-setuid-sandbox',
      '--force-device-scale-factor=1'
    ]
  });
  
  const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 }); // Mac 16:10 aspect ratio
  
  try {
    // Step 1: Go to production site
    console.log('📱 Loading TorqueX production site...');
    await page.goto('https://torquex-production.up.railway.app', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    console.log('✅ Site loaded - you should see the homepage');
    await page.screenshot({ path: 'demo-1-homepage.png' });
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Step 2: Navigate to login page
    console.log('🔐 Navigating to login page...');
    await page.goto('https://torquex-production.up.railway.app/auth/login', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    
    await new Promise(resolve => setTimeout(resolve, 800));
    await page.screenshot({ path: 'demo-2-login-page.png' });
    console.log('✅ Login page loaded');
    
    // Step 3: Fill admin credentials
    console.log('👤 Filling admin credentials...');
    const emailInput = await page.$('input[type="email"], input[name="email"], #email');
    const passwordInput = await page.$('input[type="password"], input[name="password"], #password');
    
    if (emailInput && passwordInput) {
      await emailInput.type('admin@torquex.com', {delay: 30});
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await passwordInput.type('admin123', {delay: 30});
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await page.screenshot({ path: 'demo-3-login-filled.png' });
      console.log('✅ Credentials filled');
      
      // Step 4: Submit login form
      console.log('🚀 Submitting login...');
      const submitButton = await page.$('button[type="submit"], input[type="submit"], .btn-submit');
      if (submitButton) {
        await submitButton.click();
        console.log('⏳ Waiting for login to complete...');
        
        // Wait for navigation or page change
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);
        await page.screenshot({ path: 'demo-4-after-login.png' });
        console.log('✅ Login submitted');
        
        // Step 5: Navigate to admin broadcast page
        console.log('📢 Navigating to admin broadcast page...');
        await page.goto('https://torquex-production.up.railway.app/admin/broadcasts', {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        
        await new Promise(resolve => setTimeout(resolve, 800));
        await page.screenshot({ path: 'demo-5-broadcast-page.png' });
        console.log('✅ Broadcast page loaded');
        
        // Step 6: Fill broadcast form
        console.log('✍️ Creating broadcast message...');
        const titleInput = await page.$('input[name="title"], #title, input[placeholder*="title"]');
        const messageInput = await page.$('textarea[name="message"], #message, textarea[placeholder*="message"]');
        const urlInput = await page.$('input[name="url"], #url, input[type="url"]');
        
        if (titleInput) {
          await titleInput.type('Demo Broadcast - TorqueX Special Offer', {delay: 30});
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('✅ Title entered');
        }
        
        if (messageInput) {
          await messageInput.type('Check out our amazing vehicle collection at the link below! Limited time offer available.', {delay: 25});
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('✅ Message entered');
        }
        
        if (urlInput) {
          await urlInput.type('https://torquex-production.up.railway.app/vehicles', {delay: 30});
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('✅ URL entered');
        }
        
        await page.screenshot({ path: 'demo-6-broadcast-filled.png' });
        console.log('✅ Broadcast form filled');
        
        // Step 7: Submit broadcast
        console.log('📤 Submitting broadcast...');
        const broadcastSubmit = await page.$('button[type="submit"], .btn-submit, button:contains("Send"), button:contains("Broadcast")');
        if (broadcastSubmit) {
          await broadcastSubmit.click();
          await new Promise(resolve => setTimeout(resolve, 1200));
          
          await page.screenshot({ path: 'demo-7-broadcast-sent.png' });
          console.log('✅ Broadcast submitted!');
        } else {
          console.log('ℹ️ Submit button not found - form filled for demo');
        }
      }
    } else {
      console.log('⚠️ Login form not found');
    }
    
    console.log('🎬 Demo completed! Browser will stay open for 15 more seconds...');
    console.log('📸 Screenshots saved:');
    console.log('   - demo-1-homepage.png');
    console.log('   - demo-2-login-page.png');
    console.log('   - demo-3-login-filled.png');
    console.log('   - demo-4-after-login.png');
    console.log('   - demo-5-broadcast-page.png');
    console.log('   - demo-6-broadcast-filled.png');
    console.log('   - demo-7-broadcast-sent.png');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Quick final view
    
  } catch (error) {
    console.error('❌ Demo error:', error.message);
    await page.screenshot({ path: 'demo-error.png' });
  }
  
  console.log('🏁 Closing browser...');
  await browser.close();
}

// Run the demo
runDemo().then(() => {
  console.log('✅ Demo finished successfully!');
}).catch(error => {
  console.error('❌ Demo failed:', error);
});