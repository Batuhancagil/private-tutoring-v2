# Quick Start Guide

Get your Private Tutoring Dashboard Platform running on Railway in 5 minutes!

## 🚀 Quick Deploy to Railway

### Step 1: Install Dependencies Locally (Optional)

```bash
npm install
```

### Step 2: Deploy to Railway

**Option A: Via GitHub (Recommended)**

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Railway will auto-detect Next.js and deploy!

**Option B: Via Railway CLI**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize and deploy
railway init
railway up
```

### Step 3: Add PostgreSQL Database

1. In Railway dashboard → Click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway automatically sets `DATABASE_URL` ✅

### Step 4: Set Environment Variables

In Railway → Your Service → Variables, add:

```
JWT_SECRET=generate-a-random-secret-key-here
NODE_ENV=production
```

**Generate secret:**
```bash
openssl rand -base64 32
```

### Step 5: Run Database Setup

After deployment, run:

```bash
railway run npm run db:generate
railway run npm run db:push
```

Or use Railway dashboard → Shell tab → Run commands

### Step 6: Verify

Visit: `https://your-app.railway.app/api/health`

Should return: `{"status":"ok","database":"connected"}`

## ✅ Done!

Your app is now live on Railway! 🎉

## 📚 Next Steps

1. See `RAILWAY_DEPLOY.md` for detailed deployment guide
2. See `docs/epics.md` for implementation plan
3. Start building features from Epic 1!

## 🐛 Troubleshooting

**Database not connecting?**
- Check `DATABASE_URL` is set (Railway auto-sets this)
- Run migrations: `railway run npm run db:push`

**Build failing?**
- Check Railway logs
- Verify Node.js 18+ is being used

**Need help?**
- See `RAILWAY_DEPLOY.md` for detailed guide
- Check Railway docs: docs.railway.app

