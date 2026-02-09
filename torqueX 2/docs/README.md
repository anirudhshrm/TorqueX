# TorqueX Documentation

Comprehensive technical documentation for the TorqueX car rental platform.

---

## 📚 Quick Start

**New to TorqueX?** Start here:
1. [Setup Guide](../README.md) - Installation and configuration
2. [Credentials](CREDENTIALS.md) - Default login credentials
3. [Quick Reference](QUICK_REFERENCE.md) - Common commands and workflows

---

## 🔐 Security

- **[Security Overview](SECURITY.md)** - Complete security implementation guide
- **[Encryption Guide](CRYPTO_QUICK_START.md)** - AES-256-GCM encryption setup
- **[CSRF Protection](CSRF_TOKEN_FIX.md)** - Cross-Site Request Forgery prevention
- **[Authentication](NO_CLERK_MODE.md)** - Fallback authentication system

---

## ⚡ Redis Cache

- **[Redis Setup](REDIS_SETUP_GUIDE.md)** - Configuration and deployment
- **[Redis Integration](REDIS_INTEGRATION.md)** - Implementation details
- **[Redis Quick Reference](REDIS_QUICK_REFERENCE.md)** - Common operations

---

## 🎨 UI/UX

- **[Modern UI Enhancements](MODERN_UI_ENHANCEMENTS.md)** - Dark/Light mode implementation

---

## 🧪 Testing

- **[Testing Guide](TESTING_GUIDE.md)** - E2E and unit testing strategies
- **[Test Results](TEST_RESULTS.md)** - Latest test execution results

---

## 🔧 Troubleshooting

- **[Login/Signup Issues](LOGIN_SIGNUP_TROUBLESHOOTING.md)** - Common authentication problems
- **[SSL Setup](SSL_SETUP.md)** - HTTPS configuration for development

---

## 📊 System Architecture

### Technology Stack
- **Backend:** Node.js v23.7.0 + Express
- **Database:** PostgreSQL + Prisma ORM v5.22.0
- **Cache:** Redis Cloud
- **Authentication:** Session-based with CSRF protection
- **Encryption:** AES-256-GCM (32-byte keys)
- **Templates:** EJS with Tailwind CSS

### Key Features
- ✅ Dual theme support (Light/Dark mode)
- ✅ Role-based access control (Admin/User)
- ✅ Distributed caching with Redis
- ✅ End-to-end encrypted user data
- ✅ CSRF protection on all forms
- ✅ Responsive mobile-first design

---

## 🚀 Deployment

See [Deployment Test Results](../DEPLOYMENT_TEST_RESULTS.md) for production readiness status.

**Quick Deploy:**
```bash
npm install --production
npx prisma migrate deploy
npx prisma generate
pm2 start bin/www --name torquex
```

---

## 📝 License & Support

For issues or questions, please check the troubleshooting guides above or review the main [README](../README.md).
