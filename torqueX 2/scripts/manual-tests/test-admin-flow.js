#!/usr/bin/env node

// Simple test to verify admin dashboard access
const http = require('http');
const https = require('https');
const querystring = require('querystring');

const hostname = 'localhost';
const port = 3000;

async function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login and Dashboard Access\n');

  try {
    // Step 1: Get login page
    console.log('1️⃣ Getting login page...');
    const loginPageResponse = await makeRequest({
      hostname,
      port,
      path: '/auth/login',
      method: 'GET',
    });
    
    console.log('   Status:', loginPageResponse.statusCode);
    
    if (loginPageResponse.statusCode !== 200) {
      console.log('❌ Failed to load login page');
      return;
    }
    
    // Extract CSRF token
    const csrfMatch = loginPageResponse.data.match(/name="_csrf"\s+value="([^"]*)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';
    console.log('   CSRF Token:', csrfToken ? '✅ Found' : '❌ Not found');

    // Step 2: Login with admin credentials
    console.log('\n2️⃣ Attempting admin login...');
    const loginData = querystring.stringify({
      email: 'admin@torquex.com',
      password: 'admin123',
      _csrf: csrfToken
    });

    const loginResponse = await makeRequest({
      hostname,
      port,
      path: '/auth/callback',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData),
        'Cookie': loginPageResponse.headers['set-cookie'] ? loginPageResponse.headers['set-cookie'].join('; ') : ''
      }
    }, loginData);

    console.log('   Login Status:', loginResponse.statusCode);
    console.log('   Redirect Location:', loginResponse.headers.location);
    
    if (loginResponse.statusCode === 302 && loginResponse.headers.location) {
      const redirectLocation = loginResponse.headers.location;
      
      if (redirectLocation.includes('/admin/dashboard')) {
        console.log('   ✅ Redirected to admin dashboard');
        
        // Step 3: Access admin dashboard
        console.log('\n3️⃣ Accessing admin dashboard...');
        
        const cookies = [
          ...(loginPageResponse.headers['set-cookie'] || []),
          ...(loginResponse.headers['set-cookie'] || [])
        ].join('; ');
        
        const dashboardResponse = await makeRequest({
          hostname,
          port,
          path: '/admin/dashboard',
          method: 'GET',
          headers: {
            'Cookie': cookies
          }
        });

        console.log('   Dashboard Status:', dashboardResponse.statusCode);
        
        if (dashboardResponse.statusCode === 200) {
          console.log('   ✅ Dashboard loaded successfully!');
          
          // Check for dashboard content
          const hasDashboardTitle = dashboardResponse.data.includes('Admin Dashboard') || dashboardResponse.data.includes('TorqueX Admin');
          const hasStats = dashboardResponse.data.includes('Total Users') || dashboardResponse.data.includes('Total Vehicles');
          
          console.log('   Dashboard Title Present:', hasDashboardTitle ? '✅' : '❌');
          console.log('   Stats Cards Present:', hasStats ? '✅' : '❌');
          
          if (hasDashboardTitle && hasStats) {
            console.log('\n🎉 SUCCESS! Admin dashboard is working perfectly!');
          } else {
            console.log('\n⚠️ Dashboard loaded but missing expected content');
          }
        } else {
          console.log('   ❌ Dashboard failed to load');
          console.log('   Response preview:', dashboardResponse.data.substring(0, 200));
        }
      } else {
        console.log('   ❌ Redirected to unexpected location:', redirectLocation);
      }
    } else {
      console.log('   ❌ Login failed or no redirect');
      console.log('   Response preview:', loginResponse.data.substring(0, 300));
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testAdminLogin();