#!/usr/bin/env node

const http = require('http');
const querystring = require('querystring');

async function testCSRFIssue() {
  console.log('🔒 Testing CSRF Token Issue Fix\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣ Getting login page and CSRF token...');
    const loginPageResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'GET'
    });

    const loginCsrfMatch = loginPageResponse.data.match(/name="_csrf"\s+value="([^"]*)"/);
    const loginCsrfToken = loginCsrfMatch ? loginCsrfMatch[1] : '';
    console.log('   Login CSRF Token:', loginCsrfToken ? '✅ Found' : '❌ Not found');

    // Step 2: Login
    console.log('\n2️⃣ Logging in as admin...');
    const loginData = querystring.stringify({
      email: 'admin@torquex.com',
      password: 'admin123',
      _csrf: loginCsrfToken
    });

    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/auth/callback',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData),
        'Cookie': loginPageResponse.headers['set-cookie'] ? loginPageResponse.headers['set-cookie'].join('; ') : ''
      }
    }, loginData);

    const cookies = [
      ...(loginPageResponse.headers['set-cookie'] || []),
      ...(loginResponse.headers['set-cookie'] || [])
    ].join('; ');

    console.log('   Login Status:', loginResponse.statusCode);

    // Step 3: Get vehicle form page
    console.log('\n3️⃣ Getting vehicle form page...');
    const formResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/vehicles/new',
      method: 'GET',
      headers: {
        'Cookie': cookies
      }
    });

    console.log('   Form Status:', formResponse.statusCode);

    if (formResponse.statusCode === 200) {
      const formCsrfMatch = formResponse.data.match(/name="_csrf"\s+value="([^"]*)"/);
      const formCsrfToken = formCsrfMatch ? formCsrfMatch[1] : '';
      console.log('   Form CSRF Token:', formCsrfToken ? '✅ Found' : '❌ Not found');

      // Step 4: Submit vehicle form
      console.log('\n4️⃣ Submitting test vehicle...');
      
      const vehicleData = querystring.stringify({
        _csrf: formCsrfToken,
        make: 'Toyota',
        model: 'Fortuner',
        year: '2025',
        type: 'SUV',
        pricePerDay: '23',
        seats: '7',
        transmission: 'Automatic',
        fuelType: 'Gasoline',
        description: 'Test vehicle creation',
        features: ['Air Conditioning', 'Bluetooth', 'Navigation System'],
        availability: 'on'
      });

      const submitResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/admin/vehicles',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(vehicleData),
          'Cookie': cookies
        }
      }, vehicleData);

      console.log('   Submit Status:', submitResponse.statusCode);
      
      if (submitResponse.statusCode === 200 || submitResponse.statusCode === 201) {
        console.log('   ✅ SUCCESS! Vehicle form submitted successfully');
      } else if (submitResponse.statusCode === 302) {
        console.log('   ✅ SUCCESS! Redirected (likely success)');
        console.log('   Redirect Location:', submitResponse.headers.location);
      } else if (submitResponse.statusCode === 403) {
        console.log('   ❌ STILL FAILING: CSRF/Auth error (403)');
        console.log('   Response:', submitResponse.data.substring(0, 200));
      } else {
        console.log('   ⚠️ Unexpected status:', submitResponse.statusCode);
        console.log('   Response preview:', submitResponse.data.substring(0, 300));
      }
    } else {
      console.log('   ❌ Failed to get form page');
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

function makeRequest(options, postData = null) {
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

testCSRFIssue();