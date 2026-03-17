[Ver001.000]

# DEPLOYMENT WORKFLOW
## Task 3: Deploy website-v2 to Vercel

### Step 1: Prepare Repository
```bash
# Ensure all changes committed
git add -A
git commit -m "feat(deploy): Update Vercel config for website-v2"
git push origin main
```

### Step 2: Connect to Vercel
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import `notbleaux/eSports-EXE`
4. Configure:
   - Framework: Vite
   - Root: `apps/website-v2`
   - Build: `npm run build`
   - Output: `dist`

### Step 3: Environment Variables
Set in Vercel Dashboard:
```
VITE_API_URL=https://sator-api.onrender.com
```

### Step 4: Deploy
Click "Deploy" and wait for build.

### Expected URL
`https://njz-platform.vercel.app` or `https://satorx.vercel.app`

---

## Task 4: Deploy Original Website to GitHub Pages

### Step 1: Move website to docs/
```bash
cp -r apps/website docs/archive-website
```

### Step 2: Update GitHub Pages
Settings → Pages → Source: Deploy from branch → main → /docs

### Expected URL
`https://notbleaux.github.io/eSports-EXE`

---

## Task 5: Final Validation

### Checklist
- [ ] website-v2 loads on Vercel
- [ ] All 4 hubs accessible
- [ ] Navigation works
- [ ] Original site loads on GitHub Pages
- [ ] API connectivity works
- [ ] Environment variables loaded

### Rollback Plan
If issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test locally: `cd apps/website-v2 && npm run dev`
4. Revert commit if needed