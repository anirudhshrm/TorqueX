# Stripe Payment Integration Test Guide

## Setup

1. **Add Stripe Keys to .env**
```bash
# Get your test keys from: https://dashboard.stripe.com/test/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# Or use the placeholders and get real test keys from Stripe Dashboard
```

## Test Cards

### Successful Payment
- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### Requires Authentication (3D Secure)
- **Card Number**: `4000 0027 6000 3184`
- **Expiry**: Any future date
- **CVC**: Any 3 digits

### Card Declined
- **Card Number**: `4000 0000 0000 0002`
- **Expiry**: Any future date
- **CVC**: Any 3 digits

### Insufficient Funds
- **Card Number**: `4000 0000 0000 9995`
- **Expiry**: Any future date
- **CVC**: Any 3 digits

## Testing Flow

### 1. Start the Server
```bash
SKIP_CLERK=true npm start
```

### 2. Login as User
- Navigate to: http://localhost:3000/auth/login
- Email: `user@torquex.com`
- Password: `user123`

### 3. Browse Vehicles
- Go to: http://localhost:3000/vehicles
- Click on any available vehicle
- Click "Book Now"

### 4. Create Booking
- Select start date (today or future)
- Select end date (at least 1 day after start)
- Click "Book Vehicle"

### 5. Payment Page
- You'll be redirected to `/bookings/{id}/payment`
- Use test card: **4242 4242 4242 4242**
- Enter any future expiry: **12/25**
- Enter any CVC: **123**
- Check the terms checkbox
- Click "Pay $XXX.XX"

### 6. Confirmation
- On success, redirected to confirmation page
- Booking status changes from PENDING → CONFIRMED
- View booking in "My Bookings"

## Verify Payment in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/payments
2. See your test payment listed
3. Click to view details:
   - Amount paid
   - Booking metadata
   - Payment status

## Troubleshooting

### "Stripe publishable key not found"
- Check `.env` file has `STRIPE_PUBLISHABLE_KEY` or `STRIPE_PUBLIC_KEY`
- Restart server after adding keys

### "Payment Intent creation failed"
- Check `.env` file has `STRIPE_SECRET_KEY`
- Verify key starts with `sk_test_`
- Check server logs for detailed error

### "Payment requires action"
- Used a 3D Secure test card
- Complete authentication in popup
- Or use simple test card `4242 4242 4242 4242`

## Features Implemented

✅ **Modern Stripe Payment Element**
- Automatically adapts to card/wallet types
- Built-in validation
- PCI-compliant (no card data touches your server)

✅ **Payment Intent API**
- Secure server-side payment creation
- Automatic payment confirmation
- Idempotent (can retry safely)

✅ **Test Mode Integration**
- Safe testing with test cards
- No real money charged
- Full Stripe Dashboard access

✅ **User Experience**
- Clear test card instructions
- Loading states during processing
- Error handling and display
- Booking status updates

✅ **Security**
- Payment processed entirely by Stripe
- No card details stored in database
- Secure HTTPS communication
- Metadata for tracking

## API Endpoints

### GET /bookings/{id}/payment
- Displays payment form
- Creates Stripe Payment Intent
- Returns client secret for frontend

### POST /bookings/{id}/payment
- Confirms payment completion
- Updates booking status to CONFIRMED
- Returns confirmation page URL

## Database Changes

Booking model already has:
- `paymentIntentId`: Stripe Payment Intent ID
- `status`: PENDING → CONFIRMED after payment
- `totalPrice`: Amount charged

## Next Steps

1. **Email Notifications**: Send confirmation emails
2. **Webhooks**: Handle async payment events
3. **Refunds**: Implement cancellation refunds
4. **Receipts**: Generate PDF receipts
5. **Production**: Switch to live Stripe keys
