# 🚀 DEPLOYMENT.md
## Deployment Guide for SATOR-eXe-ROTAS

**Project:** NJZ Platform / SATOR-eXe-ROTAS  
**Platforms:** Render, Vercel, GitHub Pages  
**Last Updated:** March 7, 2026

---

## 📋 Overview

This project can be deployed to multiple platforms:
- **Render** — Backend services and full-stack apps
- **Vercel** — Frontend websites (Next.js, React)
- **GitHub Pages** — Static websites

---

## 🌐 Website-V2 (NJZ Platform) Deployment

### Option 1: Vercel (Recommended for Frontend)

**Prerequisites:**
- Vercel account (free tier available)
- GitHub repository connected

**Steps:**
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import from GitHub: `notbleaux/eSports-EXE`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/website-v2`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click "Deploy"

**Auto-Deploy:**
- Every push to `main` branch triggers automatic deployment

### Option 2: Render (Full-Stack)

**Configuration file:** `infrastructure/render.yaml`

**Steps:**
1. Go to https://render.com
2. Click "New +" → "Blueprint"
3. Connect GitHub repository
4. Render reads `render.yaml` automatically
5. Click "Apply"

### Option 3: GitHub Pages (Static)

**Configuration file:** `.github/workflows/static.yml`

**Steps:**
1. Go to repository Settings → Pages
2. Source: GitHub Actions
3. Workflow already configured in `.github/workflows/`
4. Push to trigger deployment

---

## 🔧 Environment Variables

### Required Variables
| Variable | Purpose | Where to Set |
|----------|---------|--------------|
| `VITE_API_URL` | Backend API endpoint | Vercel/Render dashboard |
| `DATABASE_URL` | Database connection | Render dashboard |
| `GITHUB_TOKEN` | GitHub API access | Render dashboard |

### Setting in Vercel
1. Project Settings → Environment Variables
2. Add variable name and value
3. Apply to Production and/or Preview

### Setting in Render
1. Service Dashboard → Environment
2. Add environment variables
3. Save changes

---

## 📊 Deployment Checklist

### Before First Deploy
- [ ] Environment variables configured
- [ ] Build command tested locally
- [ ] Domain configured (optional)
- [ ] SSL/TLS enabled (automatic on most platforms)

### After Deploy
- [ ] Visit the live URL
- [ ] Check for console errors
- [ ] Test critical user flows
- [ ] Verify environment variables loaded

---

## 🔄 Continuous Deployment

All platforms support auto-deploy:

| Platform | Trigger | Branch |
|----------|---------|--------|
| Vercel | Git push | main |
| Render | Git push | main |
| GitHub Pages | Git push | main |

**Manual Deploy:**
- Vercel: "Redeploy" button in dashboard
- Render: "Manual Deploy" → "Deploy latest commit"
- GitHub Pages: Re-run workflow in Actions tab

---

## 🐛 Common Deployment Issues

### Issue: Build Fails
**Symptom:** Deployment fails with build error  
**Solution:**
1. Check build logs for error messages
2. Verify `package.json` has correct build script
3. Test locally: `npm run build`

### Issue: 404 Errors
**Symptom:** Page not found after deploy  
**Solution:**
1. Check that build output directory is correct
2. For SPAs: Configure catch-all redirect to `index.html`

### Issue: Environment Variables Not Loading
**Symptom:** API calls fail, missing config  
**Solution:**
1. Check variables are set in platform dashboard
2. Redeploy after adding variables
3. Verify variable names match code

### Issue: Slow Performance
**Symptom:** Site loads slowly  
**Solution:**
1. Enable CDN (automatic on Vercel/Render)
2. Optimize images and assets
3. Check bundle size with `npm run build`

---

## 📈 Monitoring

### Free Tier Limits
| Platform | Requests | Bandwidth | Build Time |
|----------|----------|-----------|------------|
| Vercel | 100K/day | 100 GB | 6000 min |
| Render | 750 hrs | 100 GB | Unlimited |
| GitHub Pages | 100K/day | 100 GB | N/A |

### Upgrade When:
- Approaching request limits
- Need custom domains with SSL
- Require team collaboration features

---

## 🎯 Platform Comparison

| Feature | Vercel | Render | GitHub Pages |
|---------|--------|--------|--------------|
| **Frontend** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Backend** | ⭐ | ⭐⭐⭐ | ❌ |
| **Ease of Use** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Custom Domain** | ✅ | ✅ | ✅ |
| **Free SSL** | ✅ | ✅ | ✅ |
| **Serverless** | ✅ | ❌ | N/A |

**Recommendation:**
- Use **Vercel** for frontend-only deployments
- Use **Render** for full-stack with backend
- Use **GitHub Pages** for simple static sites

---

## 🆘 Emergency Rollback

If a deployment breaks something:

### Vercel
1. Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

### Render
1. Dashboard → Deploys
2. Select previous deploy
3. Click "Rollback"

### GitHub Pages
1. Revert commit in GitHub
2. Push revert to main
3. Auto-deploys previous version

---

*For questions, see [CONTRIBUTING.md](./CONTRIBUTING.md) or open an issue.*