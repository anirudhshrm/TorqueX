const { execSync } = require('child_process');

console.log('🧪 Testing admin dashboard access...');

try {
  // Test login endpoint
  console.log('1️⃣ Testing login endpoint...');
  const loginResult = execSync(`curl -s -w "%{http_code}" -o /dev/null "http://localhost:3000/auth/login"`, { encoding: 'utf8' });
  console.log('Login page status:', loginResult.trim());
  
  // Test admin dashboard directly (should be blocked without auth)
  console.log('2️⃣ Testing admin dashboard without auth...');
  const dashboardResult = execSync(`curl -s -w "%{http_code}" -o /dev/null "http://localhost:3000/admin/dashboard"`, { encoding: 'utf8' });
  console.log('Dashboard without auth status:', dashboardResult.trim());
  
  // Test with session cookie simulation
  console.log('3️⃣ Testing with session...');
  
  // Create a simple POST request to login
  const loginCommand = `curl -s -c cookies.txt -d "email=admin@torquex.com&password=admin123" -X POST "http://localhost:3000/auth/callback"`;
  const loginOutput = execSync(loginCommand, { encoding: 'utf8' });
  console.log('Login POST response length:', loginOutput.length);
  
  // Try to access dashboard with cookies
  console.log('4️⃣ Testing admin dashboard with cookies...');
  const dashboardWithCookies = execSync(`curl -s -b cookies.txt -w "%{http_code}" "http://localhost:3000/admin/dashboard"`, { encoding: 'utf8' });
  
  // Extract status code from the end
  const statusCode = dashboardWithCookies.slice(-3);
  const responseBody = dashboardWithCookies.slice(0, -3);
  
  console.log('Dashboard with cookies status:', statusCode);
  
  if (statusCode === '200') {
    console.log('✅ SUCCESS: Dashboard loaded!');
    console.log('Response contains dashboard:', responseBody.includes('Dashboard'));
    console.log('Response contains TorqueX Admin:', responseBody.includes('TorqueX Admin'));
  } else if (statusCode.startsWith('3')) {
    console.log('📍 REDIRECT: Dashboard redirected (status ' + statusCode + ')');
    console.log('Response preview:', responseBody.substring(0, 200));
  } else if (statusCode.startsWith('5')) {
    console.log('💥 ERROR: Server error (status ' + statusCode + ')');
    
    // Look for error messages
    if (responseBody.includes('Error')) {
      const errorMatch = responseBody.match(/<h1[^>]*>([^<]*)<\/h1>/);
      if (errorMatch) {
        console.log('Error message:', errorMatch[1]);
      }
    }
    
    console.log('Error response preview:', responseBody.substring(0, 500));
  } else {
    console.log('❓ UNKNOWN: Unexpected status ' + statusCode);
    console.log('Response preview:', responseBody.substring(0, 300));
  }
  
} catch (error) {
  console.error('💥 Test failed:', error.message);
}