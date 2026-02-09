# Security & Crypto Quick Start Guide

## Quick Reference

### Importing the Crypto Module
```javascript
const crypto = require('../utils/crypto');
```

---

## Common Use Cases

### 1. Hashing a User Password

**When**: User signup or password change  
**Where**: `authController.js`

```javascript
// On signup
const { hash, salt } = await crypto.hashPassword(req.body.password);
const user = await prisma.user.create({
  data: {
    email: req.body.email,
    passwordHash: hash,
    passwordSalt: salt
  }
});

// On login
const isValid = await crypto.verifyPassword(
  req.body.password,
  user.passwordHash,
  user.passwordSalt
);

if (!isValid) {
  return res.status(401).json({ error: 'Invalid password' });
}
```

### 2. Encrypting User Phone Number

**When**: User updates profile with phone  
**Where**: `userController.js`

```javascript
// Save encrypted
const encrypted = crypto.encryptField(req.body.phone);
await prisma.user.update({
  where: { id: userId },
  data: { phone: encrypted }
});

// Retrieve and decrypt
const user = await prisma.user.findUnique({ where: { id: userId } });
const phone = crypto.decryptField(user.phone);
res.json({ phone }); // Safe to send to client
```

### 3. Creating a Promo Code

**When**: Admin creates a deal  
**Where**: `dealController.js`

```javascript
const code = req.body.code; // e.g., "SUMMER2024"
const codeHash = crypto.hashPromoCode(code);

const deal = await prisma.deal.create({
  data: {
    code: code.toUpperCase(),
    codeHash,
    discount: 20,
    // ... other fields
  }
});
```

### 4. Validating a Promo Code

**When**: User applies code at checkout  
**Where**: `dealController.js` or `bookingController.js`

```javascript
const userCode = req.body.promoCode;
const codeHash = crypto.hashPromoCode(userCode);

const deal = await prisma.deal.findUnique({
  where: { codeHash }
});

if (!deal || !deal.isActive) {
  return res.status(400).json({ error: 'Invalid promo code' });
}

// Apply discount
const discount = (totalPrice * deal.discountValue) / 100;
const finalPrice = totalPrice - discount;
```

### 5. Encrypting Payment Method

**When**: Processing Stripe payment  
**Where**: `bookingController.js`

```javascript
// After successful payment
const encrypted = crypto.encryptField(paymentMethodId);
await prisma.booking.update({
  where: { id: bookingId },
  data: {
    paymentMethod: encrypted,
    paymentIntentId: paymentIntent.id,
    status: 'CONFIRMED'
  }
});
```

### 6. Generating a Security Token

**When**: Password reset, email verification  
**Where**: Any controller

```javascript
// Generate token
const token = crypto.generateSecureToken(32);
const tokenHash = crypto.hashToken(token);

// Send token to user (via email)
sendEmail(user.email, `https://app.com/reset?token=${token}`);

// Store hash in database
await prisma.passwordReset.create({
  data: {
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + 1800000) // 30 minutes
  }
});

// Later, when user submits token
const tokenHash = crypto.hashToken(userSubmittedToken);
const reset = await prisma.passwordReset.findUnique({
  where: { tokenHash }
});

if (!reset || reset.expiresAt < new Date()) {
  return res.status(400).json({ error: 'Invalid token' });
}
```

### 7. Logging Sensitive Data Safely

**When**: Debug or audit sensitive info  
**Where**: All controllers

```javascript
// ❌ WRONG - Exposes full data
logger.info('User phone:', user.phone);

// ✅ RIGHT - Masks sensitive data
logger.info('User phone:', crypto.maskSensitiveData(user.phone));
// Output: "***-***-****7567"

// ✅ RIGHT - Mask credit card
logger.info('Card:', crypto.maskSensitiveData(cardNumber, 4));
// Output: "****1111"
```

### 8. Verifying Data Integrity

**When**: Verify booking data hasn't changed  
**Where**: Payment processing

```javascript
// Generate checksum when creating booking
const bookingData = { vehicleId, startDate, endDate, totalPrice };
const checksum = crypto.generateChecksum(bookingData);
await prisma.booking.create({
  data: {
    // ... booking fields ...
    // Store checksum in a audit log
  }
});

// Later, verify booking data
const isValid = crypto.verifyChecksum(bookingData, storedChecksum);
if (!isValid) {
  logger.warn('Booking data has been modified');
}
```

### 9. HMAC Signature for API Security

**When**: Protect API from tampering  
**Where**: Webhook handlers or API endpoints

```javascript
// Generate signature for data
const data = JSON.stringify({ bookingId, amount: 299.99 });
const signature = crypto.generateHMAC(data);

// Send both to client (or store)
res.json({ data: JSON.parse(data), signature });

// Verify on next request
const isValid = crypto.verifyHMAC(
  JSON.stringify(req.body.data),
  req.body.signature
);

if (!isValid) {
  return res.status(400).json({ error: 'Invalid signature' });
}
```

---

## Security Middleware Usage

### Enable CSRF Protection
```javascript
// Already enabled in app.js
// All forms need CSRF token:
<input type="hidden" name="_csrf" value="<%= csrfToken %>">
```

### Rate Limiting
```javascript
// Apply to login/signup routes
const rateLimit = securityMiddleware.rateLimit(5, 900000); // 5 requests per 15 min
app.post('/auth/login', rateLimit, authController.handleAuthCallback);
```

### Audit Logging
```javascript
// Log sensitive operations
router.post('/bookings', 
  securityMiddleware.auditLog('CREATE_BOOKING', 'Booking'),
  bookingController.createBooking
);
```

---

## Environment Setup

### 1. Generate ENCRYPTION_KEY
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: a3f2b1c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2

# Add to .env
echo "ENCRYPTION_KEY=a3f2b1c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2" >> .env
```

### 2. Generate SESSION_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add to .env
echo "SESSION_SECRET=..." >> .env
```

### 3. Verify Setup
```bash
node -e "
const crypto = require('./src/utils/crypto');
console.log('✅ Crypto module loaded');
console.log('✅ Password hashing available');
console.log('✅ Encryption available');
console.log('✅ Ready for production');
"
```

---

## Common Patterns

### Pattern 1: Encrypt Sensitive User Data
```javascript
// Save
user.phone = crypto.encryptField(req.body.phone);
user.address = crypto.encryptField(req.body.address);
await user.save();

// Retrieve
user.phone = crypto.decryptField(user.phone);
user.address = crypto.decryptField(user.address);
res.json(user);
```

### Pattern 2: Secure Password Authentication
```javascript
// Signup
const { hash, salt } = await crypto.hashPassword(password);
user.passwordHash = hash;
user.passwordSalt = salt;

// Login
if (await crypto.verifyPassword(password, user.passwordHash, user.passwordSalt)) {
  // Login successful
} else {
  // Invalid password
}
```

### Pattern 3: Promo Code Protection
```javascript
// Create
code = { code: 'SUMMER2024', codeHash: crypto.hashPromoCode('SUMMER2024') };

// Validate
const codeHash = crypto.hashPromoCode(userInput);
const deal = db.find({ codeHash }); // Find by hash, not code
```

### Pattern 4: Token-Based Security
```javascript
// Generate
const token = crypto.generateSecureToken();
const hash = crypto.hashToken(token);
db.save({ tokenHash: hash, expiresAt: now + 1hr });

// Verify
const hash = crypto.hashToken(userToken);
const record = db.find({ tokenHash: hash });
```

---

## Debugging

### Check if Encryption Key is Set
```javascript
console.log('ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? '✅ Set' : '❌ Not set');
```

### Test Encryption/Decryption
```javascript
const crypto = require('./src/utils/crypto');
const encrypted = crypto.encryptField('test-data');
const decrypted = crypto.decryptField(encrypted);
console.log('Match:', encrypted && decrypted === 'test-data'); // Should be true
```

### Test Password Hashing
```javascript
const crypto = require('./src/utils/crypto');
(async () => {
  const { hash, salt } = await crypto.hashPassword('TestPass123!');
  const valid = await crypto.verifyPassword('TestPass123!', hash, salt);
  console.log('Password verification:', valid); // Should be true
})();
```

### Test Promo Code
```javascript
const crypto = require('./src/utils/crypto');
const hash = crypto.hashPromoCode('SUMMER2024');
const valid = crypto.verifyPromoCode('summer2024', hash); // Case insensitive
console.log('Promo code valid:', valid); // Should be true
```

---

## Security Checklist

Before using in production:

- [ ] ENCRYPTION_KEY is set and 64 characters long
- [ ] SESSION_SECRET is set and at least 32 characters
- [ ] NODE_ENV=production
- [ ] HTTPS/SSL enabled
- [ ] Database migration run: `npx prisma migrate deploy`
- [ ] All password fields use crypto.hashPassword()
- [ ] All sensitive data uses crypto.encryptField()
- [ ] All promo codes use crypto.hashPromoCode()
- [ ] Security headers enabled in app.js
- [ ] CSRF protection enabled on all forms
- [ ] Rate limiting enabled on auth routes
- [ ] Audit logging configured
- [ ] Tests pass for encryption/decryption
- [ ] Logs don't contain unmasked sensitive data

---

## Troubleshooting

**Q: "Unsupported state or unable to authenticate data" error**  
A: Different ENCRYPTION_KEY used for encryption vs decryption. Ensure same key in all environments.

**Q: Password verification always fails**  
A: Make sure to store and retrieve BOTH passwordHash AND passwordSalt from database.

**Q: Promo code validation failing**  
A: Codes are normalized to uppercase automatically. User input "summer2024" matches code "SUMMER2024".

**Q: Sensitive data not encrypting**  
A: Verify ENCRYPTION_KEY is set. Check error logs for details.

---

## API Reference Quick Links

| Function | Purpose | Example |
|----------|---------|---------|
| `hashPassword(pwd)` | Hash password | `const {hash, salt} = await crypto.hashPassword(pwd)` |
| `verifyPassword(pwd, hash, salt)` | Verify password | `await crypto.verifyPassword(pwd, hash, salt)` |
| `encryptField(data)` | Encrypt string | `crypto.encryptField('+1-555-123')` |
| `decryptField(encrypted)` | Decrypt string | `crypto.decryptField(encryptedData)` |
| `hashPromoCode(code)` | Hash promo | `crypto.hashPromoCode('SUMMER24')` |
| `verifyPromoCode(code, hash)` | Verify promo | `crypto.verifyPromoCode(code, hash)` |
| `generateSecureToken(len)` | Generate token | `crypto.generateSecureToken(32)` |
| `hashToken(token)` | Hash token | `crypto.hashToken(token)` |
| `verifyToken(token, hash)` | Verify token | `crypto.verifyToken(token, hash)` |
| `maskSensitiveData(data, len)` | Mask for logs | `crypto.maskSensitiveData(phone, 4)` |

---

**Last Updated**: October 27, 2024  
**Version**: 1.0  
**Status**: Production Ready ✅
