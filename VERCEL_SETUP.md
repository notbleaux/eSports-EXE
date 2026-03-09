# Vercel Deployment Configuration

## Environment Variables (Set in Vercel Dashboard)
```
# If needed for API calls
VITE_API_BASE_URL=https://your-api.com
```

## Build Settings (vercel.json in docs/platform/)
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

## Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed

## Auto-Deploy
- Every push to `master` triggers deploy
- Preview deployments for pull requests
