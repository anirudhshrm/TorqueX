#!/bin/bash
echo "======================================"
echo "TorqueX API Endpoint Testing"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_count=0
pass_count=0
fail_count=0

test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    local cookies=$4
    
    test_count=$((test_count + 1))
    
    if [ -n "$cookies" ]; then
        status=$(curl -s -b $cookies -o /dev/null -w "%{http_code}" "$url")
    else
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    fi
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $name: $status"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗${NC} $name: Expected $expected_status, got $status"
        fail_count=$((fail_count + 1))
    fi
}

echo ""
echo "=== Public Endpoints ==="
test_endpoint "Homepage" "http://localhost:3000/" "200"
test_endpoint "Vehicles List" "http://localhost:3000/vehicles" "200"
test_endpoint "About Page" "http://localhost:3000/about" "200"
test_endpoint "Contact Page" "http://localhost:3000/contact" "200"
test_endpoint "Login Page" "http://localhost:3000/auth/login" "200"
test_endpoint "Signup Page" "http://localhost:3000/auth/signup" "200"

echo ""
echo "=== Protected Endpoints (Without Auth) ==="
test_endpoint "User Dashboard (No Auth)" "http://localhost:3000/user/dashboard" "302"
test_endpoint "User Profile (No Auth)" "http://localhost:3000/user/profile" "302"
test_endpoint "Admin Dashboard (No Auth)" "http://localhost:3000/admin/dashboard" "302"

echo ""
echo "=== Static Assets ==="
test_endpoint "Main CSS" "http://localhost:3000/stylesheets/style.css" "200"
test_endpoint "Homepage CSS" "http://localhost:3000/stylesheets/homepage.css" "200"
test_endpoint "Dashboard CSS" "http://localhost:3000/stylesheets/dashboard.css" "200"

echo ""
echo "=== Authentication Flow ==="
echo "Logging in as testuser..."
curl -s -c /tmp/test_cookies.txt -X POST http://localhost:3000/auth/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=testuser@example.com&password=password123" \
  -o /dev/null

sleep 1
test_endpoint "User Dashboard (With Auth)" "http://localhost:3000/user/dashboard" "200" "/tmp/test_cookies.txt"
test_endpoint "User Profile (With Auth)" "http://localhost:3000/user/profile" "200" "/tmp/test_cookies.txt"
test_endpoint "User Bookings (With Auth)" "http://localhost:3000/user/bookings" "200" "/tmp/test_cookies.txt"
test_endpoint "User Reviews (With Auth)" "http://localhost:3000/user/reviews" "200" "/tmp/test_cookies.txt"

echo ""
echo "Logging in as admin..."
curl -s -c /tmp/admin_test_cookies.txt -X POST http://localhost:3000/auth/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@torquex.com&password=admin123" \
  -o /dev/null

sleep 1
test_endpoint "Admin Dashboard (With Auth)" "http://localhost:3000/admin/dashboard" "200" "/tmp/admin_test_cookies.txt"
test_endpoint "Admin Vehicles" "http://localhost:3000/admin/vehicles" "200" "/tmp/admin_test_cookies.txt"
test_endpoint "Admin Bookings" "http://localhost:3000/admin/bookings" "200" "/tmp/admin_test_cookies.txt"
test_endpoint "Admin Broadcasts" "http://localhost:3000/admin/broadcasts" "200" "/tmp/admin_test_cookies.txt"
test_endpoint "Admin Vehicle Requests" "http://localhost:3000/admin/vehicle-requests" "200" "/tmp/admin_test_cookies.txt"
test_endpoint "Admin Stats" "http://localhost:3000/admin/stats" "200" "/tmp/admin_test_cookies.txt"

echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Total Tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo "======================================"

# Cleanup
rm -f /tmp/test_cookies.txt /tmp/admin_test_cookies.txt

if [ $fail_count -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed! ✅${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed! ❌${NC}"
    exit 1
fi
