#!/bin/bash

# Test admin booking status update with CSRF token
# This script simulates the browser flow: login -> get CSRF token -> update booking

BOOKING_ID="7bad47ed-b675-4ab2-a9aa-4c0ad8d5caee"
BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/torquex-cookies.txt"

echo "🔐 Testing Admin Booking Status Update with CSRF Token"
echo "======================================================="
echo ""

# Clean up old cookies
rm -f $COOKIE_FILE

echo "1️⃣  Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -c $COOKIE_FILE -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "email=admin@torquex.com" \
  --data-urlencode "password=Admin@123" \
  -w "\nHTTP_STATUS:%{http_code}")

LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
echo "   Login status: $LOGIN_STATUS"

if [ "$LOGIN_STATUS" != "302" ] && [ "$LOGIN_STATUS" != "200" ]; then
  echo "   ❌ Login failed"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "   ✅ Login successful"
echo ""

echo "2️⃣  Getting admin bookings page to extract CSRF token..."
BOOKINGS_PAGE=$(curl -s -b $COOKIE_FILE "${BASE_URL}/admin/bookings")

# Extract CSRF token from the page (it's in csrfToken variable or input field)
CSRF_TOKEN=$(echo "$BOOKINGS_PAGE" | grep -o "csrfToken.*=.*['\"][^'\"]*['\"]" | sed "s/.*['\"]\\([^'\"]*\\)['\"].*/\\1/" | head -1)

if [ -z "$CSRF_TOKEN" ]; then
  echo "   ❌ Could not extract CSRF token from page"
  echo "   Trying to extract from session storage..."
  # Alternative: look for the token in a different format
  CSRF_TOKEN=$(echo "$BOOKINGS_PAGE" | grep -o '<%= csrfToken %>' -A 5 -B 5 | grep -o '[a-f0-9]{64}' | head -1)
fi

if [ -z "$CSRF_TOKEN" ]; then
  echo "   ❌ Still could not find CSRF token"
  exit 1
fi

echo "   ✅ CSRF Token: ${CSRF_TOKEN:0:20}...${CSRF_TOKEN: -10}"
echo ""

echo "3️⃣  Updating booking status from PENDING to CONFIRMED..."
UPDATE_RESPONSE=$(curl -s -b $COOKIE_FILE -X PUT "${BASE_URL}/admin/bookings/${BOOKING_ID}/status" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: ${CSRF_TOKEN}" \
  -d '{"status":"CONFIRMED"}' \
  -w "\nHTTP_STATUS:%{http_code}")

UPDATE_STATUS=$(echo "$UPDATE_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | grep -v "HTTP_STATUS")

echo "   Response status: $UPDATE_STATUS"
echo "   Response body: $UPDATE_BODY"
echo ""

if [ "$UPDATE_STATUS" = "200" ]; then
  echo "✅ SUCCESS! Booking status updated successfully with CSRF token"
  echo "   The CSRF fix is working correctly!"
elif [ "$UPDATE_STATUS" = "403" ]; then
  echo "❌ FAILED! Still getting 403 - CSRF token validation failed"
  echo "   The CSRF token may not be matching"
else
  echo "⚠️  Unexpected status code: $UPDATE_STATUS"
fi

# Verify the booking was updated
echo ""
echo "4️⃣  Verifying booking status in database..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const booking = await prisma.booking.findUnique({
    where: { id: '${BOOKING_ID}' },
    select: { status: true }
  });
  console.log('   Current booking status:', booking?.status || 'NOT FOUND');
  await prisma.\$disconnect();
})();
"

echo ""
echo "✅ Test completed!"
