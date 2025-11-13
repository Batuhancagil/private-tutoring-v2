# Railway Deployment Guide

This guide will help you deploy the Private Tutoring Dashboard Platform to Railway, including the PostgreSQL database.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Account** (recommended): For automatic deployments
3. **Railway CLI** (optional): For command-line deployment

## Step 1: Install Railway CLI (Optional)

```bash
npm i -g @railway/cli
railway login
```

## Step 2: Create Railway Project

### Option A: Via Railway Dashboard (Recommended)

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"** (if you have GitHub connected)
   - OR select **"Empty Project"** and we'll connect GitHub later

### Option B: Via CLI

```bash
railway init
```

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically:
   - Create a PostgreSQL database
   - Set the `DATABASE_URL` environment variable
   - Provide connection details

**Important:** The `DATABASE_URL` is automatically set - you don't need to configure it manually!

## Step 4: Configure Environment Variables

In Railway dashboard → Your Service → Variables:

Add these environment variables:

```
JWT_SECRET=your-random-secret-key-here-generate-a-long-random-string
NODE_ENV=production
PORT=3000
```

**Generate JWT_SECRET:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use an online generator
```

## Step 5: Deploy Your Code

### Option A: GitHub Integration (Recommended)

1. **Connect GitHub:**
   - In Railway dashboard → Settings → Connect GitHub
   - Authorize Railway to access your repositories
   - Select your repository

2. **Configure Build Settings:**
   - Railway will auto-detect Next.js
   - Build Command: `npm run build` (auto-detected)
   - Start Command: `npm start` (auto-detected)

3. **Deploy:**
   - Railway will automatically deploy on every push to main branch
   - Or click "Deploy" button in dashboard

### Option B: Railway CLI

```bash
# Link to Railway project
railway link

# Deploy
railway up
```

### Option C: Manual Deploy

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up
```

## Step 6: Run Database Migrations

After first deployment, run database migrations:

### Via Railway Dashboard:
1. Go to your service
2. Click **"Deployments"** → **"View Logs"**
3. Click **"Shell"** tab
4. Run:
   ```bash
   npm run db:generate
   npm run db:push
   ```

### Via Railway CLI:
```bash
railway run npm run db:generate
railway run npm run db:push
```

## Step 7: Verify Deployment

1. **Check Health Endpoint:**
   - Visit: `https://your-app.railway.app/api/health`
   - Should return: `{"status":"ok","database":"connected"}`

2. **Check Main Page:**
   - Visit: `https://your-app.railway.app`
   - Should show the landing page

## Step 8: Set Custom Domain (Optional)

1. In Railway dashboard → Settings → Domains
2. Click **"Generate Domain"** or **"Add Custom Domain"**
3. Follow instructions to configure DNS

## Troubleshooting

### Database Connection Issues

**Problem:** Health check shows `database: disconnected`

**Solution:**
1. Verify `DATABASE_URL` is set in Railway variables
2. Check PostgreSQL service is running
3. Run migrations: `railway run npm run db:push`

### Build Failures

**Problem:** Build fails during deployment

**Solution:**
1. Check build logs in Railway dashboard
2. Verify all dependencies are in `package.json`
3. Ensure Node.js version is 18+ (Railway auto-detects)

### Environment Variables Not Working

**Problem:** App can't read environment variables

**Solution:**
1. Verify variables are set in Railway dashboard
2. Redeploy after adding variables
3. Check variable names match code (case-sensitive)

## Railway Configuration Files

The project includes these Railway-specific files:

- `railway.json` - Railway configuration
- `railway.toml` - Alternative Railway config
- `nixpacks.toml` - Build configuration

These are automatically detected by Railway.

## Database Management

### Access Database via Railway:

1. Go to PostgreSQL service in Railway
2. Click **"Data"** tab
3. Use built-in database browser

### Access via Prisma Studio:

```bash
railway run npm run db:studio
```

This will open Prisma Studio in your browser.

## Monitoring

Railway provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, network usage
- **Deployments**: Deployment history and status

Access via Railway dashboard → Your Service → Logs/Metrics

## Next Steps After Deployment

1. ✅ Database is set up and connected
2. ✅ Application is deployed
3. 🔄 Create first Superadmin user (via database or API)
4. 🔄 Implement authentication (Epic 1)
5. 🔄 Build remaining features (Epics 2-10)

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Project Docs**: See `docs/` folder

## Quick Commands Reference

```bash
# Deploy to Railway
railway up

# Run database migrations
railway run npm run db:push

# Open database shell
railway run npx prisma studio

# View logs
railway logs

# Open shell
railway shell
```

