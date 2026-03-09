[Ver003.000]

# 🚀 NJZ VLR API - STEP BY STEP DEPLOYMENT GUIDE

## ✅ STATUS: READY FOR DEPLOYMENT

All blocking issues have been resolved. Follow these steps to deploy.

---

## 📍 PROJECT LOCATION

```bash
cd /root/.openclaw/workspace/njz-vlr-api
```

---

## STEP 1: SYSTEM CHECK (30 seconds)

Run this command to verify your system is ready:

```bash
python3 --version
```

**Expected:** Python 3.9+ (You have 3.12.3 ✅)

---

## STEP 2: DEPLOY (2 minutes)

### Option A: Development Mode (Recommended First)

```bash
cd /root/.openclaw/workspace/njz-vlr-api
./deploy.sh dev
```

This will:
1. ✅ Create virtual environment
2. ✅ Install dependencies
3. ✅ Start API server
4. ✅ Show live logs

**Access:** http://localhost:3001

**Test:**
```bash
# In another terminal:
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0"
}
```

---

## STEP 3: VERIFY ENDPOINTS

Test these URLs in your browser or with curl:

| Endpoint | URL | Expected |
|----------|-----|----------|
| Root | http://localhost:3001/ | API info |
| Health | http://localhost:3001/health | Status |
| Upcoming Matches | http://localhost:3001/v2/matches/upcoming | Match list |
| Live Matches | http://localhost:3001/v2/matches/live | Empty or matches |
| Rankings | http://localhost:3001/v2/rankings?region=na | Rankings |
| Docs (dev only) | http://localhost:3001/docs | Swagger UI |

---

## STEP 4: CONFIGURE FOR PRODUCTION

### Edit Configuration

```bash
nano /root/.openclaw/workspace/njz-vlr-api/.env
```

Add these settings:

```bash
# Required for production
DEBUG=false
HOST=0.0.0.0
PORT=3001

# Security (generate strong secrets)
WEBHOOK_SECRET=your-random-secret-here-change-me
API_KEY_REQUIRED=true
ALLOWED_API_KEYS=your-api-key-1,your-api-key-2

# Generate secrets with:
# openssl rand -hex 32
```

---

## STEP 5: PRODUCTION DEPLOYMENT

### Stop dev server first (Ctrl+C)

Then run:

```bash
cd /root/.openclaw/workspace/njz-vlr-api
./deploy.sh prod
```

This starts with:
- 2 worker processes
- Production logging
- No auto-reload

---

## STEP 6: BACKGROUND DEPLOYMENT

To run in background:

```bash
cd /root/.openclaw/workspace/njz-vlr-api
source venv/bin/activate

# Start in background
nohup uvicorn main:app --host 0.0.0.0 --port 3001 --workers 2 &

# Check it's running
curl http://localhost:3001/health
```

---

## 🔧 TROUBLESHOOTING

### Issue: Port already in use

```bash
# Find process
lsof -i :3001

# Kill it
kill -9 <PID>
```

### Issue: Permission denied

```bash
chmod +x deploy.sh
```

### Issue: Module not found

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: Import errors

```bash
# Ensure in correct directory
cd /root/.openclaw/workspace/njz-vlr-api
pwd  # Should show /root/.openclaw/workspace/njz-vlr-api
```

---

## 📊 PROJECT STRUCTURE

```
njz-vlr-api/
├── main.py                    # ✅ API entry point
├── deploy.sh                  # ✅ Deployment script
├── requirements.txt           # ✅ Dependencies
├── .env                       # ⚠️  You create this
├── src/
│   ├── scrapers/
│   │   └── match_scraper.py   # ✅ Match scraping
│   ├── core/
│   │   ├── config.py          # ✅ Configuration
│   │   ├── exceptions.py      # ✅ Error handling
│   │   └── logging.py         # ✅ Logging
│   ├── data/
│   │   ├── models/
│   │   │   └── match.py       # ✅ Data models
│   │   └── storage/
│   │       └── raws_storage.py # ✅ RAWS storage
│   ├── api/
│   │   ├── middleware/
│   │   │   ├── tier_system.py      # ✅ API tiers
│   │   │   └── cache_control.py    # ✅ Caching
│   │   └── routes/v2/
│   │       ├── matches.py     # ✅ Match routes
│   │       └── ...
│   ├── services/
│   │   ├── webhook_service.py      # ✅ Webhooks
│   │   └── export_service.py       # ✅ Data export
│   └── utils/
│       ├── circuit_breaker.py      # ✅ Circuit breaker
│       ├── checksums.py            # ✅ SHA-256
│       ├── http_client.py          # ✅ HTTP client
│       └── dom_anomaly_detector.py # ✅ DOM detection
├── data/                      # Created on deploy
│   ├── raws/                  # Raw scrape storage
│   ├── base/                  # Processed data
│   └── cache/                 # Cache files
└── logs/                      # Log files
```

---

## 🎯 VERIFICATION CHECKLIST

After deployment, verify:

- [ ] `curl http://localhost:3001/health` returns healthy
- [ ] `curl http://localhost:3001/` shows API info
- [ ] `curl http://localhost:3001/v2/matches/upcoming` returns data
- [ ] No errors in terminal output
- [ ] All endpoints respond within 2 seconds

---

## 📞 QUICK COMMANDS

```bash
# Deploy development
./deploy.sh dev

# Deploy production
./deploy.sh prod

# Check health
curl http://localhost:3001/health

# View all endpoints
curl http://localhost:3001/

# Test matches endpoint
curl http://localhost:3001/v2/matches/upcoming | head -20

# Stop server
# Press Ctrl+C in the terminal

# Run in background
nohup ./deploy.sh prod &
tail -f nohup.out
```

---

## ✅ DEPLOYMENT COMPLETE

**Status:** All systems ready 🚀

**Next Action:**
```bash
cd /root/.openclaw/workspace/njz-vlr-api
./deploy.sh dev
```

Then test with: `curl http://localhost:3001/health`