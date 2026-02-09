# Running TorqueX Without Clerk

Your app supports **two authentication modes**:

## 🔐 Authentication Modes

### 1. Clerk Authentication (Default)
- Cloud-based authentication
- Requires internet connection
- Uses Clerk's hosted login UI

### 2. Manual/Fallback Authentication
- Session-based authentication
- Works offline
- Uses your custom login/signup forms
- Credentials stored in local database

---

## 🚀 How to Run Without Clerk

### Option 1: Using Environment Variable
```bash
# Start server without Clerk
npm run start:no-clerk

# Or for development with auto-reload
npm run dev:no-clerk
```

### Option 2: Set Environment Variable Manually
```bash
# Set the variable
export SKIP_CLERK=true

# Then start normally
npm start
```

---

## 📝 Creating Test Users

1. **Start the server without Clerk:**
   ```bash
   npm run start:no-clerk
   ```

2. **Create admin user:**
   ```bash
   node scripts/create-admin.js
   ```
   Default admin credentials:
   - Email: `admin@torquex.com`
   - Password: `admin123`

3. **Create test users:**
   ```bash
   node scripts/create-test-users.js
   ```

4. **Or use the signup page:**
   - Go to `http://localhost:3000/auth/signup`
   - Fill out the form
   - You'll be logged in with manual authentication

---

## 🎯 Demo the App

1. **Start without Clerk:**
   ```bash
   npm run start:no-clerk
   ```

2. **Open browser to:**
   ```
   http://localhost:3000
   ```

3. **Login with:**
   - Email: `admin@torquex.com`
   - Password: `admin123`
   
   Or create a new account via `/auth/signup`

---

## 🔄 How It Works

The app automatically detects and uses manual authentication when:
- ✅ `SKIP_CLERK=true` environment variable is set
- ✅ User has an active manual auth session
- ✅ Request is from Puppeteer (for testing)

Otherwise, it uses Clerk authentication.

---

## 🛠️ Technical Details

**Manual Auth Session Structure:**
```javascript
req.session = {
  manualAuth: true,
  userId: 1  // Database user ID
}
```

**Authentication Middleware:**
- `populateUser`: Checks both Clerk and manual auth
- `requireAuth`: Enforces authentication for protected routes
- Works with both auth systems transparently

---

## 📸 Taking Screenshots

Puppeteer automatically bypasses Clerk to take screenshots:
```bash
node demo-puppeteer.js
```

Check `screenshots/` folder for captured pages.

---

## ⚠️ Production Notes

For production deployments:
- Keep Clerk enabled for better security
- Use manual auth only for demos/testing
- Ensure proper password hashing (already implemented with bcrypt)
- Manual auth is fully functional but Clerk provides additional security features
