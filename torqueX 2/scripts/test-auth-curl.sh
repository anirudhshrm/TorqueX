#!/bin/bash

BASE_URL="http://localhost:3030"

echo "===== Testing Auth Routes with Curl ====="

# Test login GET route
echo -e "\n1. Testing GET /auth/login"
curl -s -o /dev/null -w "Status: %{http_code}\n" $BASE_URL/auth/login

# Test signup GET route
echo -e "\n2. Testing GET /auth/signup"
curl -s -o /dev/null -w "Status: %{http_code}\n" $BASE_URL/auth/signup

# Test login POST route with data
echo -e "\n3. Testing POST /auth/callback (login)"
curl -s -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@example.com&password=password123" \
  -o /dev/null -w "Status: %{http_code}\n" \
  $BASE_URL/auth/callback

# Test signup POST route with data
echo -e "\n4. Testing POST /auth/callback (signup)"
curl -s -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Test%20User&email=test2@example.com&password=password123" \
  -o /dev/null -w "Status: %{http_code}\n" \
  $BASE_URL/auth/callback

echo -e "\nTests complete!"