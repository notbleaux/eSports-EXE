[Ver001.000]

# Environment Files

The repo intentionally ships several `.env` templates because different deploy targets have different variable surfaces. This page explains which one to use when.

## Files at root

| File | Purpose | Commit policy |
|---|---|---|
| `.env.example` | Canonical reference for local development. Copy to `.env.local`. | Committed |
| `.env.local.Development` | Pre-filled local development sample (DB urls, ports). Copy to `.env.local`. | Committed (no secrets) |
| `.env.production.template` | Variable surface required by production deploys. Fill secrets in the host's secret manager, not in a file. | Committed |
| `.env.render` | Render.com-specific variables (build hooks, service names). | Committed |
| `.env.services.example` | Variables consumed by `services/*/` (API, websocket, agent broker). | Committed |
| `.env.local` | Your local secrets. | **Never** commit — covered by `.gitignore` |
| `.env.production` | Real production values. | **Never** commit |

## Which to copy when

| Scenario | Copy this |
|---|---|
| First local setup | `cp .env.example .env.local` |
| Render deploy | Set values from `.env.render` in Render's dashboard |
| Vercel deploy | Set values from `.env.production.template` in Vercel's dashboard |
| Running just a service | `cp .env.services.example services/<svc>/.env` |

## Why we don't consolidate

The variable sets overlap but don't match — production needs vars (Sentry DSN, Pandascore key) that local doesn't, and local needs vars (Docker hostnames) that production doesn't. Keeping templates separate prevents accidental leakage of one surface into another.
