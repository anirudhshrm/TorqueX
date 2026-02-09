# TorqueX User Credentials

This file contains login credentials for testing purposes. These credentials can be used to access different user roles in the TorqueX application.

## Admin Credentials

Use these credentials to access the admin dashboard and administrative features:

```
Email: admin@torquex.com
Password: admin123
```

After logging in with these credentials, you'll be redirected to the admin dashboard at `/admin/dashboard`.

## Regular User Credentials

Use these credentials to access regular user features:

```
Email: user@torquex.com
Password: user123
```

After logging in with these credentials, you'll be redirected to the user dashboard at `/user/dashboard`.

## Test User Credentials

Additional test users for various testing scenarios:

```
Email: test1@torquex.com
Password: test123

Email: test2@torquex.com
Password: test123
```

## Important Notes

1. These credentials are for development and testing purposes only.
2. In production, replace these with secure credentials.
3. If using the application's manual authentication (non-Clerk), any password will work for these accounts as the system is currently configured for development purposes.
4. When using Clerk authentication, you need to ensure these users exist in your Clerk account.

## Admin Features

With admin credentials, you can:
- Manage vehicles inventory
- Review and update booking statuses
- Send broadcasts to all users
- View dashboard analytics

## Regular User Features

With regular user credentials, you can:
- Browse available vehicles
- Make bookings
- View your booking history
- Receive admin broadcasts
- Leave reviews