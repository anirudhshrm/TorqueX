#!/usr/bin/env node
/**
 * Test CSRF validation for multipart vehicle form submission
 */
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function main() {
  try {
    const client = axios.create({
      baseURL: BASE_URL,
      withCredentials: true,
      validateStatus: () => true
    });

    // 1. Login first
    console.log('🔐 Step 1: Logging in as admin...');
    const loginPageResp = await client.get('/auth/login');
    const csrfMatch = loginPageResp.data.match(/name="_csrf"\s+value="([^"]*)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : null;
    const cookies = loginPageResp.headers['set-cookie'];
    
    console.log('   CSRF token:', csrfToken?.substring(0, 20) + '...');

    const loginResp = await client.post('/auth/login', 
      `email=admin@torquex.com&password=admin123&_csrf=${csrfToken}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 0
      }
    );

    if (loginResp.status !== 302) {
      console.log('❌ Login failed:', loginResp.status);
      return;
    }

    const sessionCookies = loginResp.headers['set-cookie'] || cookies;
    console.log('✅ Logged in successfully');

    // 2. Get vehicle form page to get CSRF token
    console.log('\n📄 Step 2: Getting vehicle form page...');
    const formPageResp = await client.get('/admin/vehicles/new', {
      headers: {
        'Cookie': sessionCookies.join('; ')
      }
    });

    const formCsrfMatch = formPageResp.data.match(/name="_csrf"\s+value="([^"]*)"/);
    const formCsrfToken = formCsrfMatch ? formCsrfMatch[1] : null;
    console.log('   Form CSRF token:', formCsrfToken?.substring(0, 20) + '...');

    // 3. Prepare multipart form data
    console.log('\n📤 Step 3: Submitting vehicle form with multipart data...');
    const form = new FormData();
    
    // Create a test image file
    const testImagePath = path.join(process.cwd(), 'public', 'images', 'vehicles', 'vehicle-1763354477655-1.png');
    
    form.append('_csrf', formCsrfToken);
    form.append('make', 'TestMake');
    form.append('model', 'TestModel');
    form.append('year', '2024');
    form.append('type', 'SUV');
    form.append('pricePerDay', '99.99');
    form.append('seats', '5');
    form.append('transmission', 'Automatic');
    form.append('fuelType', 'Hybrid');
    form.append('description', 'Testing CSRF validation with multipart upload');
    form.append('features', 'test-feature-1,test-feature-2');
    form.append('image', fs.createReadStream(testImagePath), {
      filename: 'test-upload.png',
      contentType: 'image/png'
    });

    const uploadResp = await client.post('/admin/vehicles', form, {
      headers: {
        ...form.getHeaders(),
        'Cookie': sessionCookies.join('; ')
      },
      maxRedirects: 0
    });

    console.log('\n📊 Upload Response:');
    console.log('   Status:', uploadResp.status, uploadResp.statusText);
    
    if (uploadResp.status === 302) {
      console.log('   ✅ SUCCESS! Redirected to:', uploadResp.headers.location);
      console.log('\n🎉 CSRF validation PASSED for multipart form!');
    } else if (uploadResp.status === 403) {
      console.log('   ❌ FAILED! CSRF validation rejected the request');
      console.log('   Response:', uploadResp.data);
    } else if (uploadResp.status === 200 || uploadResp.status === 201) {
      console.log('   ✅ SUCCESS! Vehicle created');
      console.log('   Response:', uploadResp.data);
    } else {
      console.log('   ⚠️  Unexpected status');
      console.log('   Response:', typeof uploadResp.data === 'string' ? uploadResp.data.substring(0, 200) : uploadResp.data);
    }

    // 4. Verify the vehicle was created
    console.log('\n🔍 Step 4: Verifying vehicle was created...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const testVehicle = await prisma.vehicle.findFirst({
      where: {
        name: {
          contains: 'TestMake',
          mode: 'insensitive'
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (testVehicle) {
      console.log('   ✅ Vehicle found in database!');
      console.log('   ID:', testVehicle.id);
      console.log('   Name:', testVehicle.name);
      console.log('   Price:', testVehicle.pricePerDay);
    } else {
      console.log('   ❌ Vehicle NOT found in database');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', typeof error.response.data === 'string' 
        ? error.response.data.substring(0, 200) 
        : error.response.data);
    }
  }
}

main();
