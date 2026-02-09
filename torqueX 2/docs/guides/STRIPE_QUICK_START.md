# Quick Start: Test Stripe Payment

## 1. Setup (One-Time)

Add these to your `.env` file (get from https://dashboard.stripe.com/test/apikeys):

```bash
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

## 2. Start Server

```bash
SKIP_CLERK=true npm start
```

## 3. Test Payment Flow

### Login
- Go to: http://localhost:3000/auth/login
- User: `user@torquex.com` / `user123`

### Book a Vehicle
1. Browse: http://localhost:3000/vehicles
2. Click any vehicle → "Book Now"
3. Select dates → Submit booking

### Make Payment
1. You'll see payment page with test card banner
2. **Use test card**: `4242 4242 4242 4242`
3. **Expiry**: `12/25` (any future date)
4. **CVC**: `123` (any 3 digits)
5. Check terms → Click "Pay"

### Success!
- Redirected to confirmation page
- Booking status: PENDING → CONFIRMED
- View in "My Bookings"

## Test Cards Cheat Sheet

| Purpose | Card Number | Result |
|---------|-------------|--------|
| Success | `4242 4242 4242 4242` | ✅ Payment succeeds |
| Declined | `4000 0000 0000 0002` | ❌ Card declined |
| Insufficient | `4000 0000 0000 9995` | ❌ Insufficient funds |
| 3D Secure | `4000 0027 6000 3184` | 🔐 Requires auth |

## Features Implemented

✅ Modern Stripe Payment Element (automatic validation)
✅ Secure Payment Intent API (PCI compliant)
✅ Beautiful responsive UI with booking summary  
✅ Test mode banner with card instructions
✅ Loading states & error handling
✅ Booking status automation (PENDING → CONFIRMED)
✅ No card data stored on server

## View Payments

Check Stripe Dashboard: https://dashboard.stripe.com/test/payments

See all test payments with metadata (booking ID, vehicle name, etc.)
