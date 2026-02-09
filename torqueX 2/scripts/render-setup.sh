#!/bin/bash

# Render Post-Deployment Setup Script
# Run this in Render shell after initial deployment

echo "🚀 Starting TorqueX Render Deployment Setup..."

# Check if we're in production
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  Warning: NODE_ENV is not set to 'production'"
fi

# Generate Prisma client
echo "📦 Generating Prisma client..."
npm run prisma:generate

# Run database migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate

# Create demo users
echo "👥 Creating demo users..."
npm run setup:demo

# Verify Redis connection
echo "🔄 Verifying Redis connection..."
npm run verify:redis

echo "✅ Setup complete!"
echo ""
echo "🎉 Your TorqueX application is ready!"
echo "Test credentials:"
echo "Admin: admin@torquex.com / admin123"
echo "User: user@torquex.com / user123"
echo ""
echo "Don't forget to:"
echo "- Update Stripe keys for payments"
echo "- Configure webhook endpoints"
echo "- Set up monitoring if needed"