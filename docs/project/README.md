[Ver001.000]

# SATOR / eSports-EXE Platform

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

> **S**ports **A**nalytics **T**racking & **O**bservation **R**eporting — A comprehensive esports analytics platform with tactical FPS simulation capabilities.

## 🚀 Quick Links

| Resource | Link |
|----------|------|
| 🌐 **Live Website** | [https://satorx.github.io/eSports-EXE](https://satorx.github.io/eSports-EXE) |
| 📊 **Analytics Hub** | `/hubs/analytics/` |
| 🎮 **Game Simulation** | [RadiantX](simulation-game/) |
| 📚 **API Documentation** | [Redoc](shared/axiom-esports-data/docs/API_REFERENCE.md) |
| 🔧 **Architecture** | [ARCHITECTURE.md](ARCHITECTURE.md) |

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Website    │  │  React App   │  │   Godot Game (Sim)   │  │
│  │   (Static)   │  │  (sator-web) │  │   (RadiantX)         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼─────────────────────┼──────────────┘
          │                 │                     │
          └─────────────────┼─────────────────────┘
                            │ HTTPS/REST + WebSocket
┌───────────────────────────▼───────────────────────────────────┐
│                      API LAYER (FastAPI)                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  • Players API    • Matches API    • Analytics API     │  │
│  │  • Collection API • Dashboard API  • Real-time WS     │  │
│  │  • Firewall       • Rate Limiting  • Auth Ready       │  │
│  └────────────────────────┬───────────────────────────────┘  │
└───────────────────────────┼───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                   DATA LAYER (Supabase Free)                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  • PostgreSQL + TimescaleDB  • Row-Level Security     │  │
│  │  • 500MB Storage             • 30 Max Connections     │  │
│  │  • Real-time Subscriptions   • Automated Backups      │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Features

### Data Pipeline
- **Multi-Source Extraction**: VLR.gg, HLTV.org, Liquipedia
- **Automated Processing**: Delta updates, full reprocessing, backfill
- **Data Quality**: Integrity checks, cross-validation, deduplication
- **Firewall Protection**: GAME_ONLY_FIELDS prevented from web exposure

### Analytics Engine
- **SimRating™**: 5-component performance rating
- **RAR (Role-Adjusted Replacement)**: Value above replacement level
- **Investment Grading**: A+ through D rating with confidence tiers
- **Temporal Analysis**: Age curves, decay weights, trend detection

### Web Platform
- **5 Hub System**: Analytics, Esports, Fantasy, Help, Stat-Ref
- **NJZ Grid Navigation**: Responsive, accessible navigation
- **Porcelain Cubed**: Custom CSS design system
- **Real-time Updates**: WebSocket support for live data

### Game Simulation (RadiantX)
- **Deterministic Engine**: 20 TPS, seeded RNG for reproducibility
- **Tactical AI**: Belief-based agent system with partial observability
- **Dual Game Support**: Valorant + Counter-Strike 2
- **Replay System**: Frame-by-frame match reconstruction

## 🛠️ Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)
- Godot 4.x (for game development)

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE

# 2. Configure environment
cp shared/axiom-esports-data/.env.example shared/axiom-esports-data/.env
# Edit .env with your database credentials

# 3. Start infrastructure (database + cache)
cd shared/axiom-esports-data/infrastructure
docker-compose up -d postgres redis

# 4. Run database migrations
cd ..
python scripts/run_migrations.py --env=development

# 5. Start API server
cd api
pip install -r requirements.txt
uvicorn main:app --reload

# 6. Start web app (new terminal)
cd shared/apps/sator-web
npm install
npm run dev

# 7. Open game in Godot Editor
# Open simulation-game/project.godot in Godot 4.x
```

### Environment Setup

Create `.env` files from templates:

```bash
# API environment
cp shared/axiom-esports-data/.env.example shared/axiom-esports-data/.env
# Edit: Add your Supabase connection string

# Web app environment
cp shared/apps/sator-web/.env.example shared/apps/sator-web/.env.local
# Edit: Add API URL
```

## 📁 Project Structure

```
/
├── website/                    # Static website (HTML/CSS/JS)
│   ├── hubs/                   # 5 hub pages
│   │   ├── analytics/          # Analytics dashboard
│   │   ├── esports/            # Esports news & schedules
│   │   ├── fantasy/            # Fantasy league system
│   │   ├── help/               # Help center
│   │   └── stat-ref/           # Player/team reference
│   └── design-system/          # Porcelain Cubed CSS
│
├── simulation-game/            # Godot 4 tactical FPS
│   ├── scripts/                # GDScript game logic
│   ├── Defs/                   # JSON game definitions
│   └── tactical-fps-sim-core/  # C# simulation engine
│
├── shared/                     # Shared components
│   ├── apps/
│   │   ├── sator-web/          # React frontend (Vite + TS)
│   │   └── radiantx-game/      # Game integration modules
│   │
│   ├── axiom-esports-data/     # Python data pipeline
│   │   ├── api/                # FastAPI REST service
│   │   │   ├── main.py         # API entry point
│   │   │   ├── src/
│   │   │   │   ├── routes/     # API endpoints
│   │   │   │   ├── middleware/ # Firewall, auth
│   │   │   │   └── db_manager.py
│   │   │   └── Dockerfile
│   │   ├── pipeline/           # Data orchestration
│   │   ├── analytics/          # Calculations (SimRating, RAR)
│   │   ├── extraction/         # Web scraping
│   │   └── infrastructure/     # Docker, migrations (9 files)
│   │
│   ├── packages/               # TypeScript packages
│   │   ├── stats-schema/       # Public type definitions
│   │   └── data-partition-lib/ # Firewall enforcement
│   │
│   └── docs/                   # Documentation
│       ├── agents.md
│       ├── FIREWALL_POLICY.md
│       └── API_REFERENCE.md
│
└── tests/                      # Test suites
    ├── integration/            # E2E tests
    └── unit/                   # Component tests
```

## 🗄️ Database Schema

### Core Tables
- `players` — Player profiles and aggregated stats
- `matches` — Match metadata and results
- `player_stats` — Per-match player performance (37 KCRITR fields)
- `raw_extractions` — Immutable scraped data
- `reconstruction_data` — Calculated/derived analytics
- `sator_events` — Spatial match events (5-layer system)

### Migrations
9 migration files in `shared/axiom-esports-data/infrastructure/migrations/`:
1. `001_initial_schema.sql` — Core tables
2. `002_sator_layers.sql` — Spatial event tables
3. `003_dual_storage.sql` — Raw + reconstruction storage
4. `004_extraction_log.sql` — Audit logging
5. `005_staging_system.sql` — Data staging
6. `006_monitoring_tables.sql` — Health monitoring
7. `007_dual_game_partitioning.sql` — CS2 + Valorant support
8. `008_dashboard_tables.sql` — Analytics caching
9. `009_alert_scheduler_tables.sql` — Scheduled jobs

## 🚀 Deployment

### Production Stack (Free Tier)

| Service | Provider | Cost | Purpose |
|---------|----------|------|---------|
| **Database** | [Supabase](https://supabase.com) | $0 | PostgreSQL + TimescaleDB |
| **API** | [Render](https://render.com) | $0 | FastAPI hosting |
| **Web** | [Vercel](https://vercel.com) | $0 | React + static site |
| **Static** | [GitHub Pages](https://pages.github.com) | $0 | Backup hosting |

### Deployment Steps

1. **Database Setup**
   ```bash
   # Create Supabase project at https://supabase.com
   # Get connection string from Dashboard → Settings → Database
   
   # Run migrations
   python shared/axiom-esports-data/scripts/run_migrations.py --env=production
   ```

2. **API Deployment (Render)**
   - Connect GitHub repo to Render
   - Use `render.yaml` blueprint
   - Set environment variables in Render Dashboard

3. **Web Deployment (Vercel)**
   - Import repo to Vercel
   - Set `shared/apps/sator-web/` as root
   - Configure API proxy to Render URL

4. **Verify**
   ```bash
   curl https://your-api.onrender.com/health
   curl https://your-web.vercel.app
   ```

## 🔐 Security

### Data Partition Firewall
Game-internal fields are blocked from web exposure:
- `internalAgentState` — AI decision tree
- `radarData` — Real-time positions
- `seedValue` — RNG seed for predictions
- `simulationTick` — Engine timing
- `visionConeData` — AI vision state

### API Security
- CORS configured for specific origins
- Rate limiting: 30 requests/minute (free tier)
- Request logging for audit trails
- No secrets committed to repository

## 📊 Monitoring

### Health Endpoints
- `GET /health` — Basic health check
- `GET /ready` — Readiness probe
- `GET /live` — Liveness probe
- `GET /dashboard/health` — Data freshness status

### Metrics
- Request latency & throughput
- Database connection pool status
- Pipeline job success/failure rates
- Cache hit/miss ratios

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

- **RadiantX Game**: MIT License
- **Axiom Esports Data**: CC BY-NC 4.0 (Non-commercial use with attribution)
- **Website**: MIT License

## 🆘 Support

- 📧 **Email**: support@satorx.gg
- 💬 **Discord**: [Join Server](https://discord.gg/satorx)
- 🐛 **Issues**: [GitHub Issues](https://github.com/notbleaux/eSports-EXE/issues)
- 📖 **Docs**: [Full Documentation](shared/docs/)

---

<p align="center">
  <strong>SATOR</strong> — Strategic Analytics for Tactical Observation & Reporting<br>
  <sub>Built with ❤️ for the esports community</sub>
</p>
