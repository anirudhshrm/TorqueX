#!/bin/bash

# Script to generate self-signed SSL certificate for local development

echo "🔐 Generating SSL certificate for local development..."

# Create ssl directory if it doesn't exist
mkdir -p ssl

# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/server.key \
  -out ssl/server.cert \
  -subj "/C=US/ST=State/L=City/O=TorqueX/OU=Development/CN=localhost"

echo "✅ SSL certificate generated successfully!"
echo "📁 Certificate files created in ./ssl/"
echo "   - ssl/server.key (private key)"
echo "   - ssl/server.cert (certificate)"
echo ""
echo "⚠️  Note: This is a self-signed certificate for development only."
echo "   For production, use a proper SSL certificate from a trusted CA."
