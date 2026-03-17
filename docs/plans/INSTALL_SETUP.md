# Install & Setup Guide (Free Tools Only)

## Local Development
```bash
# Frontend
cd apps/website-v2
npm ci
npm run dev  # http://localhost:5173

# Backend/Data
cd packages/shared/axiom-esports-data
pip install -r requirements.txt
pytest

# Godot Sim
godot --headless --path platform/simulation-game/
```

## Production Free Setup
1. Vercel: `npx vercel` (website-v2/dist)
2. Render: Connect repo, `plan: free`
3. Supabase: New project, copy DATABASE_URL
4. Upstash: Redis URL to env

## Trading Sim Script
```bash
python data/trading_ev.py --backtest  # EV metrics
```

**Verification**: `npm test`, `pytest`, health checks.
**VSCode Extensions**: Tailwind CSS IntelliSense, Python, Godot Tools.

