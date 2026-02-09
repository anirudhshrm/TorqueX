const axios = require('axios');

async function testAdminDashboard() {
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  try {
    console.log('🔐 Logging in as admin...');
    
    // First, get the login page to extract CSRF token
    const loginPage = await axiosInstance.get('/auth/login');
    const csrfMatch = loginPage.data.match(/<input[^>]*name="_csrf"[^>]*value="([^"]*)"[^>]*>/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';
    
    console.log('🛡️ CSRF Token:', csrfToken ? 'Found' : 'Not found');
    
    // Login with admin credentials
    const loginData = new URLSearchParams();
    loginData.append('email', 'admin@torquex.com');
    loginData.append('password', 'admin123');
    if (csrfToken) {
      loginData.append('_csrf', csrfToken);
    }
    
    const loginResponse = await axiosInstance.post('/auth/callback', loginData, {
      maxRedirects: 0, // Don't follow redirects so we can see where it goes
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    console.log('✅ Login response status:', loginResponse.status);
    console.log('🔗 Location header:', loginResponse.headers.location);
    
    if (loginResponse.headers.location) {
      // Follow the redirect manually
      console.log('📍 Following redirect to:', loginResponse.headers.location);
      
      const dashboardResponse = await axiosInstance.get(loginResponse.headers.location, {
        validateStatus: function (status) {
          return status >= 200 && status < 600; // Accept any response
        }
      });
      
      console.log('📊 Dashboard response status:', dashboardResponse.status);
      
      if (dashboardResponse.status === 200) {
        console.log('✅ SUCCESS: Dashboard loaded successfully!');
        console.log('📄 Content preview:', dashboardResponse.data.substring(0, 200) + '...');
      } else {
        console.log('❌ ERROR: Dashboard returned status', dashboardResponse.status);
        
        if (dashboardResponse.data.includes('Error')) {
          const errorMatch = dashboardResponse.data.match(/<h1[^>]*>([^<]*)<\/h1>/);
          console.log('💥 Error message:', errorMatch ? errorMatch[1] : 'Unknown error');
        }
        
        console.log('📄 Error page content preview:', dashboardResponse.data.substring(0, 500) + '...');
      }
    } else {
      console.log('⚠️ No redirect location found');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    if (error.response) {
      console.error('📄 Error response status:', error.response.status);
      console.error('📄 Error response data preview:', error.response.data.substring(0, 500));
    }
  }
}

testAdminDashboard();