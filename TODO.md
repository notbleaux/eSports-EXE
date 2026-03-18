# Deployment Fix TODO
## Phase 1: Fix TS Build Errors (Priority 1)
- [ ] Create missing utils/logger.ts
- [ ] Create utils/cn.ts (tailwind-merge)
- [ ] Create theme/colors.ts
- [ ] Create components/ui/GlassCard.tsx
- [ ] Create components/ui/GlowButton.tsx
- [ ] Add vite-env.d.ts for import.meta.env typing
- [ ] Fix api/mlRegistry.ts type mismatches
- [ ] Fix TacticalView.test.tsx canvas mock
- [ ] Relax ESLint no-unused-vars to warn
- [ ] cd apps/website-v2 && npm run typecheck (0 errors)

## Phase 2: Deploy & Verify
- [ ] npm run build (success)
- [ ] vercel --prod
- [ ] curl https://sator-api.onrender.com/health
- [ ] docker compose up -d
- [ ] ./scripts/health-check-all.sh

## Phase 3: MCP & Connectivity
- [ ] go run render-mcp-server/main.go
- [ ] Test MCP postgres/redis connections

