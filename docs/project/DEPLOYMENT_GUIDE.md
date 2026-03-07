# SATOR Deployment Guide - Supabase + Render

## Step 1: Supabase Setup (Database)

### 1.1 Create Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with your GitHub account
4. Choose your GitHub username as the organization name

### 1.2 Create New Project
1. Click "New Project"
2. **Organization**: Your GitHub username
3. **Project Name**: `sator-esports` (or any name)
4. **Database Password**: Click "Generate a password" → COPY THIS!
5. **Region**: Select closest to your users (e.g., `N. Virginia` for US East)
6. Click "Create new project"
7. Wait 1-2 minutes for provisioning

### 1.3 Get Connection String
1. Once project is ready, go to left sidebar
2. Click ⚙️ **Project Settings** (bottom)
3. Click **Database** tab
4. Find **"Connection string"** section
5. Select **URI** format
6. Copy the connection string
7. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the password you saved

**Example connection string:**
```
postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxxxxxxxxx.supabase.co:5432/postgres
```

Save this - you'll need it for Render!

---

## Step 2: Render.com Setup (Backend API)

### 2.1 Create Account
1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with your GitHub account
4. Authorize Render to access your repositories

### 2.2 Deploy via Blueprint
1. Go to https://dashboard.render.com/blueprints
2. Click **"New Blueprint Instance"**
3. Connect your GitHub repository (eSports-EXE)
4. Render will detect `render.yaml` automatically
5. Click **"Apply"** to create services

### 2.3 Add Environment Variables
After services are created:

1. Click on **sator-api** service
2. Go to **Environment** tab
3. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Supabase connection string from Step 1.3
4. Click **Save Changes**
5. Click **Manual Deploy** → **Deploy latest commit**

### 2.4 Verify Deployment
1. Wait for deployment to complete (2-3 minutes)
2. Click the URL (e.g., `https://sator-api.onrender.com`)
3. Visit `/health` endpoint:
   ```
   https://sator-api.onrender.com/health
   ```
4. You should see: `{"status":"healthy"}`

---

## Step 3: GitHub Pages (Frontend)

### 3.1 Push to GitHub
```bash
git add .
git commit -m "Deployment setup"
git push origin main
```

### 3.2 Enable GitHub Pages
1. Go to your GitHub repository
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **GitHub Actions**
4. The workflow will run automatically on push to main

### 3.3 Access Your Site
- After workflow completes (~2 minutes)
- Visit: `https://yourusername.github.io/eSports-EXE`

---

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly in Render
- Check Supabase project is active (not paused)
- Ensure password in connection string is correct

### API Not Starting
- Check Render logs: Dashboard → sator-api → Logs
- Verify all environment variables are set
- Check `requirements.txt` is in correct location

### Frontend Not Loading
- Verify GitHub Actions workflow ran successfully
- Check repository is public (for GitHub Pages)
- Wait 2-3 minutes after push for deployment

---

## URLs After Deployment

| Component | URL Example |
|-----------|-------------|
| Frontend | https://yourusername.github.io/eSports-EXE |
| API Base | https://sator-api.onrender.com |
| Health Check | https://sator-api.onrender.com/health |
| API Docs | https://sator-api.onrender.com/docs |
| Supabase Dashboard | https://supabase.com/dashboard/project/xxx |
