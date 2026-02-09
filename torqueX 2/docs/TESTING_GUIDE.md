# TorqueX Setup & Testing Guide

## 🚀 Quick Start Guide

### 1. Installation

```bash
# Clone the repository
git clone <repo-url>
cd torqueX

# Install dependencies
npm install

# Setup Prisma
npm run prisma:generate
npm run prisma:migrate

# Create initial admin user
npm run create:admin

# Create test users (optional)
npm run create:test-users
```

### 2. Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your credentials in `.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/torquex"
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SESSION_SECRET=your-32-char-secret-key
   ```

### 3. Development Server

```bash
# Start development server with auto-reload
npm run dev

# Or start production server
npm start

# Build Tailwind CSS (in another terminal)
npm run build:css

# Open browser to http://localhost:3000
```

---

## 🧪 Testing Scenarios

### Test 1: Browse Vehicles
**Endpoint:** `http://localhost:3000/`

**Steps:**
1. Click "Browse Vehicles"
2. Filter by type, price range
3. Click on a vehicle to see details
4. Verify vehicle images, specs, and price are displayed

**Expected Result:** Vehicle listing and details display correctly

---

### Test 2: Complete Booking Flow

**Prerequisites:** User must be logged in

**Steps:**
1. View a vehicle detail page
2. Click "Book Now"
3. Enter start and end dates
4. Verify price calculation updates
5. Enter promo code (optional)
6. Accept terms and proceed
7. Complete payment

**Expected Results:**
- [ ] Booking form loads with vehicle details
- [ ] Price updates based on dates
- [ ] Promo code validation works
- [ ] Payment form displays Stripe element
- [ ] Payment processes successfully
- [ ] Confirmation page shows all details
- [ ] Email confirmation sent (if email configured)

---

### Test 3: Admin Dashboard

**Prerequisites:** Login with admin account

**Endpoint:** `http://localhost:3000/admin/dashboard`

**Steps:**
1. Navigate to admin dashboard
2. View statistics and analytics
3. Manage vehicles
4. Manage bookings
5. Send broadcasts
6. View user activity

**Expected Results:**
- [ ] Dashboard loads without errors
- [ ] Statistics display correct data
- [ ] Vehicle management CRUD works
- [ ] Booking filters work correctly

---

### Test 4: Review System

**Prerequisites:** User must have completed a booking

**Steps:**
1. Go to "My Bookings"
2. Find completed booking
3. Click "Leave Review"
4. Enter rating and comment
5. Submit review

**Expected Results:**
- [ ] Review form loads
- [ ] Review is saved to database
- [ ] Review appears on vehicle page
- [ ] Average rating is calculated correctly

---

### Test 5: Real-time Features

**Prerequisites:** Two browsers logged in (one admin, one user)

**Steps:**
1. Admin sends a broadcast message
2. Check user browser for notification
3. Admin updates booking status
4. Verify user sees real-time update

**Expected Results:**
- [ ] Messages appear in real-time
- [ ] Status updates are instant
- [ ] Socket.io connection is stable

---

## 🧬 API Testing with cURL

### Create a Booking
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "vehicle-id-here",
    "startDate": "2025-12-01T10:00:00",
    "endDate": "2025-12-03T10:00:00"
  }'
```

### Get User Bookings
```bash
curl http://localhost:3000/bookings \
  -H "Cookie: session=your-session-cookie"
```

### Process Payment
```bash
curl -X POST http://localhost:3000/bookings/booking-id/payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethodId": "pm_card_visa"
  }'
```

---

## 🔑 Test Stripe Cards

Use these test card numbers for payment testing:

| Card Type | Number | CVC | Date |
|-----------|--------|-----|------|
| Visa | 4242424242424242 | 123 | 12/25 |
| Visa (debit) | 4000056655665556 | 123 | 12/25 |
| Mastercard | 5555555555554444 | 123 | 12/25 |
| Amex | 378282246310005 | 1234 | 12/25 |
| Declining | 4000000000000002 | 123 | 12/25 |

---

## 📊 Database Testing

### Connect to Prisma Studio
```bash
npm run prisma:studio
```

### View Database in Studio
- Browse all tables
- View records
- Make direct edits
- Test queries

### Common Test Data Setup

```sql
-- Insert test vehicle
INSERT INTO "Vehicle" (id, name, type, "pricePerDay", availability, description, images, features, "createdAt")
VALUES ('test-car-1', 'Tesla Model 3', 'Electric', 99.99, true, 'Premium electric vehicle', '{}', '{}', NOW());

-- Insert test user (if using manual auth)
INSERT INTO "User" (id, "clerkId", name, email, role, "createdAt")
VALUES ('user-1', 'clerk_123', 'Test User', 'test@example.com', 'USER', NOW());
```

---

## 🐛 Common Issues & Solutions

### Issue: Stripe payment fails
**Solution:**
1. Verify API keys are correct in `.env`
2. Check Stripe test vs live mode
3. Ensure webhook secret is configured
4. Check browser console for errors

### Issue: Booking form doesn't load
**Solution:**
1. Verify user is logged in
2. Check vehicle ID is valid
3. View browser console for errors
4. Check server logs

### Issue: Email notifications not sending
**Solution:**
1. Configure SendGrid API key
2. Verify sender email is verified
3. Check email templates exist
4. Enable email in environment

### Issue: Real-time features not working
**Solution:**
1. Verify Socket.io is initialized
2. Check browser console for connection errors
3. Ensure socket event handlers are registered
4. Check server logs for socket errors

---

## 📈 Performance Testing

### Load Testing Endpoints

```bash
# Install Apache Bench
brew install httpd  # macOS
apt-get install apache2-utils  # Linux

# Test vehicle listing
ab -n 100 -c 10 http://localhost:3000/vehicles

# Test booking endpoint
ab -n 50 -c 5 http://localhost:3000/bookings
```

### Monitor Performance
- Check response times
- Monitor database queries
- Check memory usage
- Monitor Socket.io connections

---

## ✅ Pre-Deployment Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] All features work as expected
- [ ] Environment variables set correctly
- [ ] Database backups configured
- [ ] Error logging enabled
- [ ] SSL certificate installed
- [ ] CDN configured for images
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] CORS configured properly
- [ ] Admin credentials changed
- [ ] Email service verified
- [ ] Stripe webhook tested
- [ ] Database migrations run

---

## 📚 Useful Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Socket.io Documentation](https://socket.io/docs/)
- [EJS Template Guide](https://ejs.co/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Last Updated:** October 27, 2025
