# SSL Certificate Setup for TorqueX

## Development (Self-Signed Certificate)

### Generate SSL Certificate

```bash
npm run generate-cert
```

This will create:
- `ssl/server.key` - Private key
- `ssl/server.cert` - Self-signed certificate

### Start Server with SSL

```bash
npm run dev
```

The server will automatically:
- Run HTTPS on `https://localhost:3443`
- Redirect HTTP (`http://localhost:3000`) to HTTPS

### Browser Warning

When using self-signed certificates, your browser will show a security warning. This is normal for development.

**Chrome/Edge:** Click "Advanced" → "Proceed to localhost (unsafe)"
**Firefox:** Click "Advanced" → "Accept the Risk and Continue"

## Production (Trusted Certificate)

For production, use a certificate from a trusted Certificate Authority (CA):

### Option 1: Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

### Option 2: Commercial CA

Purchase a certificate from providers like:
- DigiCert
- GoDaddy
- Comodo
- Namecheap

### Configure Production SSL

1. Copy your certificates to the `ssl/` directory:
   ```bash
   cp /path/to/privkey.pem ssl/server.key
   cp /path/to/fullchain.pem ssl/server.cert
   ```

2. Set environment variables (optional):
   ```bash
   PORT=80           # HTTP redirect port
   HTTPS_PORT=443    # HTTPS port
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

- `PORT` - HTTP server port (default: 3000)
- `HTTPS_PORT` - HTTPS server port (default: 3443)

## SSL Files

Add to `.gitignore`:
```
ssl/*.key
ssl/*.cert
ssl/*.pem
```

Keep your private keys secure and never commit them to version control!

## Troubleshooting

### Certificate not loading
- Ensure files exist: `ls -la ssl/`
- Check file permissions: `chmod 600 ssl/server.key`

### Port already in use
- Change ports in `.env`:
  ```
  PORT=8080
  HTTPS_PORT=8443
  ```

### Socket.io issues with HTTPS
The server automatically configures Socket.io to use the HTTPS server when certificates are present.
