# Production Environment Setup
**[Ver001.000]** - Libre-X-eSport 4NJZ4 TENET Platform

## Overview
This document contains the production credentials and setup instructions for moving from mock data to real esports data via PandaScore API.

---

## 🔐 Credentials Summary

### Supabase (Database)
| Setting | Value |
|---------|-------|
| **Project Name** | NJZitegeiste |
| **Project ID** | sxwyaxfresusroiezxxc |
| **API URL** | https://sxwyaxfresusroiezxxc.supabase.co |
| **Database Password** | `DnOXmJ4kzI52VNv7` |
| **Connection String** | `postgresql://postgres:DnOXmJ4kzI52VNv7@db.sxwyaxfresusroiezxxc.supabase.co:6543/postgres` |

### PandaScore (Esports Data API)
| Setting | Value |
|---------|-------|
| **API Key** | `B9XAy0v6DlkQicA6s46x3uFmlS6Cr7frU32ImN5XPKO3QSkTKjE` |
| **Base URL** | https://api.pandascore.co |
| **Rate Limit** | 1000 calls/day, 1 call/second |

### Vercel (Frontend Hosting)
| Setting | Value |
|---------|-------|
| **Project ID** | `prj_GC4GheoL6bWs3AIyuBUaYqDkfdoI` |
| **Production URL** | https://website-v2-ashen-mu.vercel.app |

### Render (Backend API)
| Setting | Value |
|---------|-------|
| **Service Name** | sator-api |
| **Plan** | Free Tier |

---

## 🚀 Platform Configuration

### 1. Render.com (Backend)

Set these environment variables in the Render dashboard:

```bash
# Database
DATABASE_URL=postgresql://postgres:DnOXmJ4kzI52VNv7@db.sxwyaxfresusroiezxxc.supabase.co:6543/postgres
SUPABASE_URL=https://sxwyaxfresusroiezxxc.supabase.co
SUPABASE_SERVICE_KEY=<get_from_supabase_dashboard>

# Esports Data
PANDASCORE_API_KEY=B9XAy0v6DlkQicA6s46x3uFmlS6Cr7frU32ImN5XPKO3QSkTKjE

# Security (Generate in Render)
JWT_SECRET_KEY=<generate_32_char_random>
TOTP_ENCRYPTION_KEY=<generate_32_char_random>
ENCRYPTION_KEY=<generate_32_char_random>
```

### 2. Vercel (Frontend)

Set these environment variables in Vercel Project Settings:

```bash
VITE_API_URL=https://sator-api.onrender.com/v1
VITE_WS_URL=wss://sator-api.onrender.com/v1/ws
VITE_SUPABASE_URL=https://sxwyaxfresusroiezxxc.supabase.co
VITE_SUPABASE_ANON_KEY=<get_from_supabase_dashboard>
VITE_PANDASCORE_API_KEY=B9XAy0v6DlkQicA6s46x3uFmlS6Cr7frU32ImN5XPKO3QSkTKjE
```

### 3. Supabase Dashboard Settings

1. **Connection Pooling**: Use port 6543 (pooler) for serverless functions
2. **Row Level Security**: Enable RLS on all tables
3. **API Keys**: Get the `anon` key for frontend, `service_role` key for backend

---

## 📊 Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Vercel    │────▶│  Render API  │────▶│  Supabase   │
│  (Frontend) │◄────│   (FastAPI)  │◄────│ (Database)  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  PandaScore  │
                    │ (Esports API)│
                    └──────────────┘
```

---

## ✅ Migration Checklist

- [ ] Set `DATABASE_URL` in Render dashboard
- [ ] Set `PANDASCORE_API_KEY` in Render dashboard
- [ ] Set `SUPABASE_SERVICE_KEY` in Render dashboard
- [ ] Set `JWT_SECRET_KEY` in Render dashboard (generate)
- [ ] Set `VITE_API_URL` in Vercel dashboard
- [ ] Set `VITE_SUPABASE_ANON_KEY` in Vercel dashboard
- [ ] Run database migrations
- [ ] Test PandaScore API connection
- [ ] Deploy frontend
- [ ] Deploy backend
- [ ] Verify real data is flowing

---

## 🔧 Testing PandaScore Connection

```bash
# Test API key
curl -H "Authorization: Bearer B9XAy0v6DlkQicA6s46x3uFmlS6Cr7frU32ImN5XPKO3QSkTKjE" \
  https://api.pandascore.co/valorant/matches?per_page=5
```

## 🔗 Important URLs

- **Supabase Dashboard**: https://supabase.com/dashboard/project/sxwyaxfresusroiezxxc
- **Vercel Dashboard**: https://vercel.com/njzitegeiste
- **Render Dashboard**: https://dashboard.render.com
- **PandaScore Docs**: https://developers.pandascore.co/

---

*Last Updated: 2026-03-24*
