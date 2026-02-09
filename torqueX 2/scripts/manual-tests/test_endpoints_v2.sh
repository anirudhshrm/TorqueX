#!/bin/bash
echo "======================================"
echo "TorqueX API Endpoint Testing v2"
echo "======================================"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

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
        status=$(curl -s -L -b $cookies -o /dev/null -w "%{http_code}" "$url")
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
echo "=== Authentication Tests ==="
echo "Testing admin login flow..."

# First get login page to get CSRF token
rm -f /tmp/admin_cookies.txt
curl -s -c /tmp/admin_cookies.txt http://localhost:3000/auth/login > /tmp/login.html

# Extract CSRF token from login page
csrf_token=$(grep -o 'name="csrf" value="[^"]*"' /tmp/login.html | sed 's/name="csrf" value="//;s/"//')

if [ -z "$csrf_token" ]; then
    echo -e "${RED}✗ Could not extract CSRF token${NC}"
else
    echo "CSRF token extracted: ${csrf_token:0:20}..."
    
    # Perform login with CSRF token
    curl -s -L -b /tmp/admin_cookies.txt -c /tmp/admin_cookies.txt \
      -X POST http://localhost:3000/auth/login \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "email=admin@torquex.com&password=admin123&csrf=$csrf_token" \
      -o /dev/null
    
    sleep 1
    
    # Test admin endpoints with session
    test_endpoint "Admin Dashboard" "http://localhost:3000/admin/dashboard" "200" "/tmp/admin_cookies.txt"
    test_endpoint "Admin Vehicles" "http://localhost:3000/admin/vehicles" "200" "/tmp/admin_cookies.txt"
    test_endpoint "Admin Bookings" "http://localhost:3000/admin/bookings" "200" "/tmp/admin_cookies.txt"
    test_endpoint "Admin Broadcasts" "http://localhost:3000/admin/broadcasts" "200" "/tmp/admin_cookies.txt"
    test_endpoint "Admin Vehicle Requests" "http://localhost:3000/admin/vehicle-requests" "200" "/tmp/admin_cookies.txt"
    test_endpoint "Admin Stats" "http://localhost:3000/admin/stats" "200" "/tmp/admin_cookies.txt"
fi

echo ""
echo "=== API Response Time Test ==="
start_time=$(date +%s%N)
curl -s http://localhost:3000/vehicles > /dev/null
end_time=$(date +%s%N)
elapsed=$((($end_time - $start_time) / 1000000))
echo "Vehicle list page response time: ${elapsed}ms"

echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Total Tests: $test_count"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo "======================================"

# Cleanup
rm -f /tmp/admin_cookies.txt /tmp/login.html

if [ $fail_count -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed! Application is ready for deployment.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please review the failures above.${NC}"
    exit 1
fi
