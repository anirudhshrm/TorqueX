// Test script for authentication routes
const axios = require('axios');

// Base URL for the API
const BASE_URL = 'http://localhost:3000';

// Test user data
const testUser = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'password123'
};

// Function to test authentication routes
async function testAuthRoutes() {
  try {
    console.log('=== Testing Authentication Routes ===');
    
    // Test GET /auth/login
    console.log('\nTesting GET /auth/login...');
    const loginResponse = await axios.get(`${BASE_URL}/auth/login`);
    console.log('Status:', loginResponse.status);
    console.log('Content-Type:', loginResponse.headers['content-type']);
    console.log('Response size:', loginResponse.data.length);
    
    // Test GET /auth/signup
    console.log('\nTesting GET /auth/signup...');
    const signupResponse = await axios.get(`${BASE_URL}/auth/signup`);
    console.log('Status:', signupResponse.status);
    console.log('Content-Type:', signupResponse.headers['content-type']);
    console.log('Response size:', signupResponse.data.length);
    
    // Test POST /auth/callback (signup)
    console.log('\nTesting POST /auth/callback (signup)...');
    try {
      const signupCallbackResponse = await axios.post(`${BASE_URL}/auth/callback`, testUser);
      console.log('Status:', signupCallbackResponse.status);
      console.log('Headers:', signupCallbackResponse.headers);
    } catch (error) {
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Headers:', error.response.headers);
        console.log('Response:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    }
    
    // Test POST /auth/callback (login)
    console.log('\nTesting POST /auth/callback (login)...');
    try {
      const loginCallbackResponse = await axios.post(`${BASE_URL}/auth/callback`, {
        email: testUser.email,
        password: testUser.password
      });
      console.log('Status:', loginCallbackResponse.status);
      console.log('Headers:', loginCallbackResponse.headers);
    } catch (error) {
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Headers:', error.response.headers);
        console.log('Response:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error testing auth routes:', error.message);
  }
}

// Run the tests
testAuthRoutes();