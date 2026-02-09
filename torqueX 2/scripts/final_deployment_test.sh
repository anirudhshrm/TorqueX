#!/bin/bash
echo "========================================="
echo "TorqueX Final Deployment Validation"
echo "========================================="

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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
        return 0
    else
        echo -e "${RED}✗${NC} $name: Expected $expected_status, got $status"
        fail_count=$((fail_count + 1))
        return 1
    fi
}

echo ""
echo -e "${BLUE}=== Phase 1: Public Endpoints ===${NC}"
test_endpoint "Homepage" "http://localhost:3000/" "200"
test_endpoint "Vehicles List" "http://localhost:3000/vehicles" "200"
test_endpoint "About Page" "http://localhost:3000/about" "200"
test_endpoint "Contact Page" "http://localhost:3000/contact" "200"
test_endpoint "Login Page" "http://localhost:3000/auth/login" "200"
test_endpoint "Signup Page" "http://localhost:3000/auth/signup" "200"

echo ""
echo -e "${BLUE}=== Phase 2: Security - Unauthorized Access ===${NC}"
test_endpoint "User Dashboard (No Auth)" "http://localhost:3000/user/dashboard" "302"
test_endpoint "User Profile (No Auth)" "http://localhost:3000/user/profile" "302"
test_endpoint "User Bookings (No Auth)" "http://localhost:3000/user/bookings" "302"
test_endpoint "Admin Dashboard (No Auth)" "http://localhost:3000/admin/dashboard" "302"
test_endpoint "Admin Vehicles (No Auth)" "http://localhost:3000/admin/vehicles" "302"

echo ""
echo -e "${BLUE}=== Phase 3: Static Assets ===${NC}"
test_endpoint "Main CSS" "http://localhost:3000/stylesheets/style.css" "200"
test_endpoint "Homepage CSS" "http://localhost:3000/stylesheets/homepage.css" "200"
test_endpoint "Dashboard CSS" "http://localhost:3000/stylesheets/dashboard.css" "200"
test_endpoint "Admin CSS" "http://localhost:3000/stylesheets/admin.css" "200"

echo ""
echo -e "${BLUE}=== Phase 4: Admin Authentication Flow ===${NC}"
echo "Fetching login page and extracting CSRF token..."

rm -f /tmp/admin_cookies.txt /tmp/login_page.html
curl -s -c /tmp/admin_cookies.txt http://localhost:3000/auth/login > /tmp/login_page.html

# Extract CSRF token (field name is _csrf)
csrf_token=$(grep -o '_csrf" value="[^"]*"' /tmp/login_page.html | sed 's/_csrf" value="//;s/"//')

if [ -n "$csrf_token" ]; then
    echo -e "${GREEN}✓ CSRF token extracted successfully${NC}"
    echo "Token: ${csrf_token:0:30}..."
    
    echo ""
    echo "Attempting admin login..."
    
    login_response=$(curl -s -L -b /tmp/admin_cookies.txt -c /tmp/admin_cookies.txt \
      -X POST http://localhost:3000/auth/login \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "email=admin@torquex.com&password=admin123&_csrf=$csrf_token" \
      -w "\nFINAL_URL:%{url_effective}")
    
    final_url=$(echo "$login_response" | grep "FINAL_URL:" | sed 's/FINAL_URL://')
    
    if [[ "$final_url" == *"/admin/dashboard"* ]]; then
        echo -e "${GREEN}✓ Admin login successful - redirected to dashboard${NC}"
        
        echo ""
        echo -e "${BLUE}=== Phase 5: Authenticated Admin Endpoints ===${NC}"
        test_endpoint "Admin Dashboard" "http://localhost:3000/admin/dashboard" "200" "/tmp/admin_cookies.txt"
        test_endpoint "Admin Vehicles" "http://localhost:3000/admin/vehicles" "200" "/tmp/admin_cookies.txt"
        test_endpoint "Admin Bookings" "http://localhost:3000/admin/bookings" "200" "/tmp/admin_cookies.txt"
        test_endpoint "Admin Broadcasts" "http://localhost:3000/admin/broadcasts" "200" "/tmp/admin_cookies.txt"
        test_endpoint "Admin Vehicle Requests" "http://localhost:3000/admin/vehicle-requests" "200" "/tmp/admin_cookies.txt"
        test_endpoint "Admin Stats" "http://localhost:3000/admin/stats" "200" "/tmp/admin_cookies.txt"
    else
        echo -e "${RED}✗ Admin login failed - final URL: $final_url${NC}"
        fail_count=$((fail_count + 6))
        test_count=$((test_count + 6))
    fi
else
    echo -e "${RED}✗ Could not extract CSRF token${NC}"
    fail_count=$((fail_count + 7))
    test_count=$((test_count + 7))
fi

echo ""
echo -e "${BLUE}=== Phase 6: Performance Metrics ===${NC}"

# Test response times
start=$(date +%s%N)
curl -s http://localhost:3000/ > /dev/null
end=$(date +%s%N)
homepage_time=$((($end - $start) / 1000000))
echo "Homepage response time: ${homepage_time}ms"

start=$(date +%s%N)
curl -s http://localhost:3000/vehicles > /dev/null
end=$(date +%s%N)
vehicles_time=$((($end - $start) / 1000000))
echo "Vehicles page response time: ${vehicles_time}ms"

if [ $homepage_time -lt 200 ] && [ $vehicles_time -lt 200 ]; then
    echo -e "${GREEN}✓ Performance within acceptable range (<200ms)${NC}"
else
    echo -e "${YELLOW}⚠ Performance could be improved${NC}"
fi

echo ""
echo "========================================="
echo "Final Test Summary"
echo "========================================="
echo -e "Total Tests: ${BLUE}$test_count${NC}"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$fail_count${NC}"

success_rate=$((100 * $pass_count / $test_count))
echo -e "Success Rate: ${success_rate}%"
echo "========================================="

# Cleanup
rm -f /tmp/admin_cookies.txt /tmp/login_page.html

echo ""
if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ ALL TESTS PASSED!                 ║${NC}"
    echo -e "${GREEN}║  Application is ready for deployment  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    exit 0
elif [ $success_rate -ge 80 ]; then
    echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  MOSTLY READY                     ║${NC}"
    echo -e "${YELLOW}║  Review failures before deployment    ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"
    exit 1
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ CRITICAL FAILURES                 ║${NC}"
    echo -e "${RED}║  Do NOT deploy - fix issues first     ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    exit 1
fi
