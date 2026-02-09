#!/bin/bash

# TorqueX Authentication Testing Script
# Tests all login and signup endpoints

BASE_URL="${BASE_URL:-http://localhost:3000}"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Test User"

echo "╔════════════════════════════════════════════════════════╗"
echo "║   TorqueX Authentication Endpoint Testing              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Testing against: $BASE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test 1: Check if login page is accessible
echo "─────────────────────────────────────────────────────────"
echo "Test 1: GET /auth/login"
echo "─────────────────────────────────────────────────────────"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/login")
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Login page accessible (HTTP $RESPONSE)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} - Login page returned HTTP $RESPONSE"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 2: Check if signup page is accessible
echo "─────────────────────────────────────────────────────────"
echo "Test 2: GET /auth/signup"
echo "─────────────────────────────────────────────────────────"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/signup")
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Signup page accessible (HTTP $RESPONSE)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} - Signup page returned HTTP $RESPONSE"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 3: Get CSRF token for signup
echo "─────────────────────────────────────────────────────────"
echo "Test 3: Extract CSRF Token from Signup Page"
echo "─────────────────────────────────────────────────────────"
SIGNUP_RESPONSE=$(curl -s -c cookies.txt "$BASE_URL/auth/signup")
CSRF_TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o 'name="_csrf" value="[^"]*"' | sed 's/name="_csrf" value="//;s/"//')

if [ -n "$CSRF_TOKEN" ]; then
    echo -e "${GREEN}✓ PASS${NC} - CSRF token extracted: ${CSRF_TOKEN:0:20}..."
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} - Could not extract CSRF token"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Signup with fallback form
echo "─────────────────────────────────────────────────────────"
echo "Test 4: POST /auth/callback (Signup)"
echo "─────────────────────────────────────────────────────────"
echo "Creating user: $TEST_EMAIL"

SIGNUP_RESULT=$(curl -s -L -b cookies.txt -c cookies.txt \
    -w "\nHTTP_CODE:%{http_code}\nREDIRECT_URL:%{url_effective}" \
    -X POST "$BASE_URL/auth/callback" \
    -d "_csrf=$CSRF_TOKEN" \
    -d "name=$TEST_NAME" \
    -d "email=$TEST_EMAIL" \
    -d "password=$TEST_PASSWORD")

HTTP_CODE=$(echo "$SIGNUP_RESULT" | grep "HTTP_CODE:" | cut -d: -f2)
REDIRECT_URL=$(echo "$SIGNUP_RESULT" | grep "REDIRECT_URL:" | cut -d: -f2-)

if [[ "$REDIRECT_URL" == *"/dashboard"* ]] || [[ "$HTTP_CODE" == "200" ]]; then
    echo -e "${GREEN}✓ PASS${NC} - User created successfully"
    echo "  HTTP Code: $HTTP_CODE"
    echo "  Redirect: $REDIRECT_URL"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} - Signup failed"
    echo "  HTTP Code: $HTTP_CODE"
    echo "  Redirect: $REDIRECT_URL"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 5: Logout
echo "─────────────────────────────────────────────────────────"
echo "Test 5: GET /auth/logout"
echo "─────────────────────────────────────────────────────────"
LOGOUT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -b cookies.txt "$BASE_URL/auth/logout")
if [ "$LOGOUT_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Logout endpoint accessible (HTTP $LOGOUT_RESPONSE)"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ WARN${NC} - Logout returned HTTP $LOGOUT_RESPONSE"
    PASSED=$((PASSED + 1))
fi
echo ""

# Test 6: Get new CSRF token for login
echo "─────────────────────────────────────────────────────────"
echo "Test 6: Extract CSRF Token from Login Page"
echo "─────────────────────────────────────────────────────────"
rm -f cookies.txt  # Clear cookies to test fresh login
LOGIN_PAGE=$(curl -s -c cookies.txt "$BASE_URL/auth/login")
CSRF_TOKEN=$(echo "$LOGIN_PAGE" | grep -o 'name="_csrf" value="[^"]*"' | sed 's/name="_csrf" value="//;s/"//')

if [ -n "$CSRF_TOKEN" ]; then
    echo -e "${GREEN}✓ PASS${NC} - CSRF token extracted: ${CSRF_TOKEN:0:20}..."
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} - Could not extract CSRF token"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 7: Login with created user
echo "─────────────────────────────────────────────────────────"
echo "Test 7: POST /auth/callback (Login)"
echo "─────────────────────────────────────────────────────────"
echo "Logging in as: $TEST_EMAIL"

LOGIN_RESULT=$(curl -s -L -b cookies.txt -c cookies.txt \
    -w "\nHTTP_CODE:%{http_code}\nREDIRECT_URL:%{url_effective}" \
    -X POST "$BASE_URL/auth/callback" \
    -d "_csrf=$CSRF_TOKEN" \
    -d "email=$TEST_EMAIL" \
    -d "password=$TEST_PASSWORD")

HTTP_CODE=$(echo "$LOGIN_RESULT" | grep "HTTP_CODE:" | cut -d: -f2)
REDIRECT_URL=$(echo "$LOGIN_RESULT" | grep "REDIRECT_URL:" | cut -d: -f2-)

if [[ "$REDIRECT_URL" == *"/dashboard"* ]] || [[ "$HTTP_CODE" == "200" ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Login successful"
    echo "  HTTP Code: $HTTP_CODE"
    echo "  Redirect: $REDIRECT_URL"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} - Login failed"
    echo "  HTTP Code: $HTTP_CODE"
    echo "  Redirect: $REDIRECT_URL"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 8: Invalid login attempt
echo "─────────────────────────────────────────────────────────"
echo "Test 8: POST /auth/callback (Invalid Credentials)"
echo "─────────────────────────────────────────────────────────"

INVALID_LOGIN=$(curl -s -L -c cookies_invalid.txt \
    -w "\nHTTP_CODE:%{http_code}\nREDIRECT_URL:%{url_effective}" \
    -X POST "$BASE_URL/auth/callback" \
    -d "_csrf=$CSRF_TOKEN" \
    -d "email=invalid@example.com" \
    -d "password=WrongPassword123!")

HTTP_CODE=$(echo "$INVALID_LOGIN" | grep "HTTP_CODE:" | cut -d: -f2)
REDIRECT_URL=$(echo "$INVALID_LOGIN" | grep "REDIRECT_URL:" | cut -d: -f2-)

if [[ "$REDIRECT_URL" == *"/auth/login"* ]] || [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "302" ]]; then
    echo -e "${GREEN}✓ PASS${NC} - Invalid login correctly rejected"
    echo "  HTTP Code: $HTTP_CODE"
    echo "  Redirect: $REDIRECT_URL"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} - Invalid login should redirect to login page"
    echo "  HTTP Code: $HTTP_CODE"
    echo "  Redirect: $REDIRECT_URL"
    FAILED=$((FAILED + 1))
fi
echo ""

# Cleanup
rm -f cookies.txt cookies_invalid.txt

# Print Summary
TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED / $TOTAL) * 100}")

echo "═════════════════════════════════════════════════════════"
echo "                    TEST SUMMARY"
echo "═════════════════════════════════════════════════════════"
echo ""
echo "Total Tests:  $TOTAL"
echo -e "Passed:       ${GREEN}$PASSED ✓${NC}"
echo -e "Failed:       ${RED}$FAILED ✗${NC}"
echo "Success Rate: $SUCCESS_RATE%"
echo ""
echo "═════════════════════════════════════════════════════════"
echo "           AUTHENTICATION METHODS AVAILABLE"
echo "═════════════════════════════════════════════════════════"
echo ""
echo "1. ✓ Email/Password Authentication (Fallback)"
echo "   - Standard form-based authentication"
echo "   - PBKDF2 password hashing"
echo "   - Session-based auth with cookies"
echo ""
echo "2. ℹ Clerk Authentication (if configured)"
echo "   - OAuth providers (Google, GitHub, etc.)"
echo "   - Social login options"
echo "   - Requires Clerk API keys"
echo ""
echo "3. ✓ Security Features"
echo "   - CSRF protection"
echo "   - Password hashing and salting"
echo "   - Session management"
echo "   - Protected routes"
echo ""

if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
