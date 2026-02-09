#!/usr/bin/env node

/**
 * Advanced Admin Workflow Demo
 * Shows complete admin login, dashboard navigation, and broadcast creation
 */

const { execSync } = require('child_process');

console.log(`
🎭 Advanced TorqueX Admin Workflow Demo

This demo shows REAL admin functionality:
✅ Admin login (actual authentication)
✅ Dashboard navigation  
✅ Broadcast creation
✅ Screenshot capture
✅ Full user journey testing

Available demonstrations:
1. Complete Admin Workflow (Visual) - Login → Dashboard → Create Broadcast → Screenshots
2. Admin Login Test (Fast) - Test admin authentication only
3. Broadcast Creation Test - Test broadcast form functionality
4. Production Admin Test - Test admin workflow on live site
5. All Admin Tests (Headless) - Run all admin tests quickly
6. Screenshot Gallery - Generate complete admin journey screenshots

`);

const demo = process.argv[2];

if (!demo) {
  console.log('To run a specific demo, use:');
  console.log('node admin-demo.js [1-6]');
  console.log('\nFor best experience, start with demo 1 (Complete Admin Workflow)');
  process.exit(0);
}

const demos = {
  1: {
    name: 'Complete Admin Workflow (Production)',
    description: 'Test real admin workflow on live Railway deployment with screenshots',
    command: 'BASE_URL=https://torquex-production.up.railway.app SKIP_CLERK=false npm run test:e2e:headed -- --testNamePattern="complete full admin workflow" --verbose',
    note: '🌐 Tests live production site with real authentication!'
  },
  2: {
    name: 'Local Admin Workflow (Fast)',
    description: 'Test admin authentication on localhost quickly',
    command: 'BASE_URL=http://localhost:3000 SKIP_CLERK=false npm run test:e2e -- --testNamePattern="admin.*login" --verbose',
    note: '⚡ Fast local test of admin login'
  },
  3: {
    name: 'Broadcast Creation Test',
    description: 'Test broadcast form functionality specifically',
    command: 'npm run test:e2e:headed -- --testNamePattern="broadcast functionality" --verbose',
    note: '📡 Focus on broadcast creation workflow'
  },
  4: {
    name: 'Production Admin Test',
    description: 'Test admin workflow on live Railway deployment',
    command: 'BASE_URL=https://torquex-production.up.railway.app SKIP_CLERK=false npm run test:e2e -- --testNamePattern="admin workflow" --verbose',
    note: '🌐 Tests live production site'
  },
  5: {
    name: 'All Admin Tests (Headless)',
    description: 'Run all admin-related tests quickly',
    command: 'npm run test:e2e -- --testNamePattern="admin" --verbose',
    note: '🚀 Complete admin test suite'
  },
  6: {
    name: 'Screenshot Gallery',
    description: 'Generate complete admin journey screenshots',
    command: 'SKIP_CLERK=false npm run test:e2e:headed -- --testNamePattern="complete full admin workflow" --verbose',
    note: '📸 Creates full screenshot documentation'
  }
};

const selectedDemo = demos[demo];

if (!selectedDemo) {
  console.log('❌ Invalid demo number. Please choose 1-6.');
  process.exit(1);
}

console.log(`🚀 Running: ${selectedDemo.name}`);
console.log(`📝 ${selectedDemo.description}`);
console.log(`💡 ${selectedDemo.note}`);
console.log(`⚡ Command: ${selectedDemo.command}`);
console.log('\n' + '='.repeat(60) + '\n');

try {
  // Ensure screenshots directory exists
  execSync('mkdir -p screenshots', { stdio: 'inherit' });
  
  // Run the selected demo
  execSync(selectedDemo.command, { stdio: 'inherit', cwd: process.cwd() });
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ ${selectedDemo.name} completed successfully!`);
  
  if (selectedDemo.name.includes('Screenshot') || selectedDemo.name.includes('Visual')) {
    console.log('\n📸 Screenshots saved in screenshots/ directory:');
    try {
      const screenshots = execSync('ls -la screenshots/*.png 2>/dev/null || echo "No screenshots found"', { encoding: 'utf-8' });
      console.log(screenshots);
    } catch (e) {
      console.log('📁 Check screenshots/ directory for captured images');
    }
  }
  
  console.log('\n🎯 What you just demonstrated:');
  
  if (demo === '1' || demo === '6') {
    console.log('• Real admin login with credentials');
    console.log('• Dashboard navigation and verification');
    console.log('• Broadcast form interaction');
    console.log('• Screenshot capture at each step');
    console.log('• Complete user journey automation');
  } else if (demo === '2') {
    console.log('• Admin authentication testing');
    console.log('• Dashboard access verification');
    console.log('• Security boundary testing');
  } else if (demo === '3') {
    console.log('• Broadcast form interaction');
    console.log('• Admin functionality testing');
    console.log('• UI element verification');
  } else if (demo === '4') {
    console.log('• Production environment testing');
    console.log('• Live deployment verification');
    console.log('• Real-world admin workflow');
  } else if (demo === '5') {
    console.log('• Comprehensive admin test coverage');
    console.log('• Multiple admin scenarios');
    console.log('• Full regression testing');
  }
  
} catch (error) {
  console.log('\n❌ Demo execution failed:');
  console.log('Error:', error.message);
  console.log('\n🛠 Troubleshooting:');
  console.log('1. Make sure your local server is running: npm start');
  console.log('2. Verify admin credentials exist in your database');
  console.log('3. Check that admin routes are properly configured');
  console.log('4. Ensure Clerk is properly configured if using authentication');
  
  process.exit(1);
}

console.log('\n🎉 Admin workflow demonstration complete!');
console.log('You can now show clients/stakeholders how E2E testing works with real admin functionality.');