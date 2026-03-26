# [Ver001.000] Caching Strategy — NJZiteGeisTe Platform

## Frontend (Vercel CDN)
| Asset | TTL | Notes |
|-------|-----|-------|
| /assets/* | 1 year immutable | Vite content-hashed filenames |
| /icons/* | 1 day | |
| /models/* | 1 week | ML model files |
| /manifest.json | 1 day | |
| *.html | no-cache | SPA entry point |
| /sw.js | no-cache | Service worker must always be fresh |

## API (Redis + HTTP)
| Endpoint | Redis TTL | HTTP Cache-Control |
|----------|-----------|-------------------|
| GET /v1/players | 300s | max-age=60, swr=300 |
| GET /v1/teams | 300s | max-age=60, swr=300 |
| GET /v1/simrating/leaderboard | 300s | max-age=120, swr=300 |
| POST/WS | — | no-store |
