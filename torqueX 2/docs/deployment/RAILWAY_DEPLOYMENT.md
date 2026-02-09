# 🚂 Railway + Neon Deployment Guide for TorqueX

## Quick Deploy (5 minutes)

### Step 1: Create Neon Database (Free)
1. Go to https://neon.tech
2. Click "Sign Up" → Sign in with GitHub
3. Click "Create Project"
4. Name: `torquex-db`
5. Region: Choose closest to you
6. Click "Create Project"
7. **Copy the connection string** (starts with `postgresql://`)
   - It looks like: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

### Step 2: Sign up for Railway
1. Go to https://railway.app
2. Click "Login" → Sign in with GitHub
3. Authorize Railway to access your GitHub account

### Step 3: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: **AkshitSalwan/torqueX**
4. Click "Deploy Now"

### Step 4: Add Redis
1. Click "+ New" again
2. Select "Database" → "Add Redis"
3. Railway will auto-configure and set `REDIS_URL`

### Step 5: Configure Environment Variables
Click on your web service → "Variables" tab → "Raw Editor" → Paste these variables:

```env
# Required Variables
NODE_ENV=production
SKIP_CLERK=true

# Session Secret (already generated for you)
SESSION_SECRET=e81bf7507bcf63e273706062b27518f36c31768cb6d31279331a013b55fb55606eb8053882dd4207b3c6c939ce2ffa7e2a2627ec378261a4220f6316280dc5ee

# Encryption Key (MUST be 64 hex characters - 32 bytes)
ENCRYPTION_KEY=7f6f9536770614df353188e6f136bb27484873290f71bdd683b69cc65588016c

# Neon Database URL (paste your connection string from Step 1)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

# REDIS_URL is automatically set by Railway Redis service
```

**Important:** Replace the DATABASE_URL with your actual Neon connection string!

### Step 6: Generate New Session Secret
Run this command locally to generate a secure session secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as your `SESSION_SECRET`.

### Step 7: Deploy
1. Railway will automatically deploy after you save the variables
2. Click "Deployments" to watch the build progress
3. Once deployed, click "Settings" → "Generate Domain" to get your public URL

### Step 8: Run Database Migrations
Railway automatically runs migrations via the start command in `railway.toml`:
```
npx prisma migrate deploy
```

### Step 9: Create Admin User
After first deployment, you need to create an admin account:

1. Go to your Railway project
2. Click on your web service
3. Click "Variables" tab
4. Add a temporary variable to run the setup:

```bash
# In Railway CLI or using a one-time deployment
railway run node scripts/create-admin.js
```

Or manually create via Prisma Studio:
1. Click on PostgreSQL service → "Data" tab
2. Find the `User` table
3. Create a new user with:
   - email: `admin@torquex.com`
   - role: `ADMIN`
   - name: `Admin`
   - clerkId: `manual-admin-123`
   - Set password hash using bcrypt

---

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Auto | PostgreSQL connection | Auto-set by Railway |
| `REDIS_URL` | ✅ Auto | Redis connection | Auto-set by Railway |
| `NODE_ENV` | ✅ | Environment | `production` |
| `PORT` | ✅ Auto | S| Neon PostgreSQL connection | From Neon dashboard |
| `REDIS_URL` | ✅ Auto | Redis connection | Auto-set by Railway |
| `NODE_ENV` | ✅ | Environment | `production` |
| `PORT` | ✅ Auto | Server port | Auto-set by Railway |
| `SESSION_SECRET` | ✅ | Session encryption | Already generated |
| `ENCRYPTION_KEY` | ✅ | Data encryption (32 bytes hex) | Already provided |
| `SKIP_CLERK` | ✅Y` | ⬜ | Stripe payments | Optional |

---

## Post-Deployment Steps

### 1. Verify Deployment
```bash
# Test your deployed site
curl https://your-app.railway.app

# Check health
curl https://your-app.railway.app/
```

### 2. Create Test Users
SSH into Railway and run:
```bash
railway run node scripts/create-test-users.js
```

### 3. Monitor Logs
In Railway dashboard:
- Click "Deployments" → "View Logs"
- Monitor for errors or issues

---

## Troubleshooting

### Build Fails
- Check Railway logs for specific errors
- Ensure `package.json` has correct Node version
- Verify all dependencies are in `dependencies` not `devDependencies`

### Database Connection Error
- Verify `DATABASE_URL` is set correctly (from Neon)
- Ensure connection string includes `?sslmode=require`
- Check Neon project is not suspended (free tier sleeps after inactivity)
- Run migrations: `railway run npx prisma migrate deploy`

### Redis Connection Error
- Verify `REDIS_URL` is set
- Check Redis service status
- Ensure Redis connection string format is correct

### Application Won't Start
- Check `railway.toml` start command
- Verify environment variables are set
- Check logs for missing dependencies

---

## Estimated Costs
Neon Database:**
- ✅ **FREE FOREVER** (0.5 GB storage, 3 GB transfer)
- Scales automatically
- No credit card required

**Railway Hosting:**
- Free Trial: $5 credit (enough for ~1 month of testing)
- After trial: ~$3-5/month
  - Web Service: ~$2/month
  - Redis: ~$1-2/month

**Total: ~$3-5/month** (Database is FREE!)
**Total: ~$5/month** for production hosting with databases included.

---

## Custom Domain (Optional)

1. In Railway dashboard → "Settings"
2. Click "Custom Domain"
3. Add your domain (e.g., `torquex.com`)
4. Update DNS records as shown:
   - Add CNAME record pointing to Railway
5. Wait for DNS propagation (5-30 minutes)

---

## Railway CLI (Optional)

Install Railway CLI for easier management:

```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Run commands
railway run node scripts/create-admin.js

# Open shell
railway shell
```

---

## Success Checklist

- [ ] Railway account created
- [ ] Project deployed from GitHub
- [ ] PostgreSQL added and connected
- [ ] Redis added and connected
- [ ] Environment variables configured
- [ ] Domain generated
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Application accessible
- [ ] Test authentication
- [ ] Test admin panel

---

🎉 Your TorqueX application is now live on Railway!

Visit your app at: **https://your-app.railway.app**
