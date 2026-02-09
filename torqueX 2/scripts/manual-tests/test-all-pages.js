const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Pages to test
const pages = [
  { name: 'Home', url: '/' },
  { name: 'About', url: '/about' },
  { name: 'Vehicles', url: '/vehicles' },
  { name: 'Contact', url: '/contact' },
];

async function checkDarkMode(page, pageName) {
  console.log(`\n🌙 Testing Dark Mode on ${pageName}...`);
  
  // Switch to dark mode
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  
  await page.waitForNetworkIdle(500);
  
  // Take dark mode screenshot
  await page.screenshot({
    path: path.join(screenshotsDir, `${pageName.toLowerCase().replace(/\s+/g, '-')}-dark.png`),
    fullPage: true
  });
  
  // Check for white backgrounds in dark mode
  const whiteBackgrounds = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const issues = [];
    
    elements.forEach(el => {
      const style = window.getComputedStyle(el);
      const bgColor = style.backgroundColor;
      const color = style.color;
      
      // Check for white/light backgrounds
      if (bgColor === 'rgb(255, 255, 255)' || bgColor === 'rgb(249, 250, 251)' || bgColor === 'rgb(243, 244, 246)') {
        const classList = Array.from(el.classList).join(' ');
        const tagName = el.tagName.toLowerCase();
        if (classList && !classList.includes('dark:bg-')) {
          issues.push({
            element: `${tagName}.${classList}`,
            issue: 'White/light background without dark mode',
            bgColor: bgColor
          });
        }
      }
      
      // Check for dark text on dark backgrounds
      if (document.documentElement.classList.contains('dark')) {
        const bgRgb = bgColor.match(/\d+/g);
        const textRgb = color.match(/\d+/g);
        if (bgRgb && textRgb) {
          const bgBrightness = (parseInt(bgRgb[0]) + parseInt(bgRgb[1]) + parseInt(bgRgb[2])) / 3;
          const textBrightness = (parseInt(textRgb[0]) + parseInt(textRgb[1]) + parseInt(textRgb[2])) / 3;
          
          // If both are dark (low brightness), there's a contrast issue
          if (bgBrightness < 100 && textBrightness < 100) {
            const classList = Array.from(el.classList).join(' ');
            const textContent = el.textContent?.trim().substring(0, 50);
            if (textContent && classList) {
              issues.push({
                element: `${el.tagName.toLowerCase()}.${classList}`,
                issue: 'Low contrast: dark text on dark background',
                text: textContent,
                bgColor: bgColor,
                textColor: color
              });
            }
          }
        }
      }
    });
    
    return issues.slice(0, 10); // Limit to 10 issues
  });
  
  if (whiteBackgrounds.length > 0) {
    console.log(`  ⚠️  Found ${whiteBackgrounds.length} potential dark mode issues:`);
    whiteBackgrounds.forEach((issue, i) => {
      console.log(`    ${i + 1}. ${issue.element}`);
      console.log(`       Issue: ${issue.issue}`);
      if (issue.text) console.log(`       Text: "${issue.text}"`);
    });
  } else {
    console.log(`  ✅ No dark mode issues found!`);
  }
  
  // Switch back to light mode
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
  });
}

async function checkAccessibility(page, pageName) {
  console.log(`\n♿ Testing Accessibility on ${pageName}...`);
  
  const a11yIssues = await page.evaluate(() => {
    const issues = [];
    
    // Check for images without alt text
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt || img.alt.trim() === '') {
        issues.push({
          type: 'Missing alt text',
          element: img.src.substring(0, 50)
        });
      }
    });
    
    // Check for buttons without text or aria-label
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      if (!btn.textContent.trim() && !btn.getAttribute('aria-label')) {
        issues.push({
          type: 'Button without text or aria-label',
          element: btn.outerHTML.substring(0, 100)
        });
      }
    });
    
    // Check for links without text
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
        issues.push({
          type: 'Link without text or aria-label',
          element: link.href
        });
      }
    });
    
    // Check for form inputs without labels
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    inputs.forEach(input => {
      const id = input.id;
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (!label && !input.getAttribute('aria-label')) {
          issues.push({
            type: 'Form input without label',
            element: `${input.tagName} (name: ${input.name || 'none'})`
          });
        }
      }
    });
    
    return issues.slice(0, 10); // Limit to 10 issues
  });
  
  if (a11yIssues.length > 0) {
    console.log(`  ⚠️  Found ${a11yIssues.length} accessibility issues:`);
    a11yIssues.forEach((issue, i) => {
      console.log(`    ${i + 1}. ${issue.type}: ${issue.element}`);
    });
  } else {
    console.log(`  ✅ No major accessibility issues found!`);
  }
}

async function checkResponsiveness(page, pageName) {
  console.log(`\n📱 Testing Responsiveness on ${pageName}...`);
  
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];
  
  for (const viewport of viewports) {
    await page.setViewport(viewport);
    await page.waitForNetworkIdle(300);
    
    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    
    if (hasHorizontalScroll) {
      console.log(`  ⚠️  Horizontal scroll detected on ${viewport.name}`);
    } else {
      console.log(`  ✅ ${viewport.name} (${viewport.width}x${viewport.height}) - No horizontal scroll`);
    }
    
    // Take screenshot for each viewport
    await page.screenshot({
      path: path.join(screenshotsDir, `${pageName.toLowerCase().replace(/\s+/g, '-')}-${viewport.name.toLowerCase()}.png`),
      fullPage: false
    });
  }
  
  // Reset to desktop viewport
  await page.setViewport({ width: 1920, height: 1080 });
}

async function checkPerformance(page, pageName) {
  console.log(`\n⚡ Testing Performance on ${pageName}...`);
  
  const metrics = await page.evaluate(() => {
    const perfData = performance.getEntriesByType('navigation')[0];
    return {
      loadTime: perfData.loadEventEnd - perfData.fetchStart,
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
      timeToInteractive: perfData.domInteractive - perfData.fetchStart
    };
  });
  
  console.log(`  📊 Load Time: ${Math.round(metrics.loadTime)}ms`);
  console.log(`  📊 DOM Content Loaded: ${Math.round(metrics.domContentLoaded)}ms`);
  console.log(`  📊 Time to Interactive: ${Math.round(metrics.timeToInteractive)}ms`);
  
  if (metrics.loadTime > 3000) {
    console.log(`  ⚠️  Page load time is slow (>3s)`);
  } else {
    console.log(`  ✅ Good page load time`);
  }
}

async function checkConsoleErrors(page, pageName) {
  const errors = [];
  const warnings = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });
  
  return { errors, warnings };
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Application Tests\n');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list'
    ]
  });
  
  const page = await browser.newPage();
  
  // Set viewport to desktop
  await page.setViewport({ width: 1920, height: 1080 });
  
  const allIssues = [];
  
  for (const testPage of pages) {
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`📄 Testing: ${testPage.name}`);
    console.log('='.repeat(60));
    
    try {
      const url = BASE_URL + testPage.url;
      console.log(`🌐 Navigating to ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      // Wait for page to be fully loaded
      await page.waitForNetworkIdle(1000);
      
      // Take light mode screenshot
      await page.screenshot({
        path: path.join(screenshotsDir, `${testPage.name.toLowerCase()}-light.png`),
        fullPage: true
      });
      console.log(`📸 Screenshot saved`);
      
      // Run all checks
      await checkDarkMode(page, testPage.name);
      await checkAccessibility(page, testPage.name);
      await checkResponsiveness(page, testPage.name);
      await checkPerformance(page, testPage.name);
      
      console.log(`\n✅ ${testPage.name} testing complete`);
      
    } catch (error) {
      console.error(`\n❌ Error testing ${testPage.name}:`, error.message);
      allIssues.push({
        page: testPage.name,
        error: error.message
      });
    }
  }
  
  await browser.close();
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n✅ All tests completed!`);
  console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
  
  if (allIssues.length > 0) {
    console.log(`\n⚠️  Found ${allIssues.length} critical issues:`);
    allIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue.page}: ${issue.error}`);
    });
  } else {
    console.log(`\n🎉 No critical issues found! Application looks great!`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Testing complete! Review the screenshots folder for visual inspection.');
  console.log('='.repeat(60) + '\n');
}

runTests().catch(console.error);
