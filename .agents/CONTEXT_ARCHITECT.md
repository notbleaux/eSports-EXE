[CONTEXT] ARCHITECT AGENT - Repository Separation Task
[Source: docs/CRITIQUE_REMEDIATION_MASTER_PLAN.md Phase 1]

=== CRITICAL GAP ===
Kitchen Sink Anti-Pattern: Data pipeline + Web app + Game engine + Simulator in one repo
MLB Parallel: BAMTech separated from game development - we must do the same

=== TARGET ARCHITECTURE ===
1. njzitegeist-platform/ (Web + API only)
   - apps/web/ (React 18 + Vite)
   - packages/api/ (FastAPI)
   - packages/types/ (Shared schemas)

2. rotas-simulation-engine/ (Godot only - extracted)
   - Source: platform/simulation-game/
   - Output: npm package @njz/rotas-simulation
   - Build: WebAssembly + headless Linux

3. axiom-data-pipeline/ (ETL only - extracted)
   - Source: packages/shared/axiom-esports-data/
   - Deployment: Kubernetes CronJobs
   - Infrastructure: Terraform

=== DELIVERABLES ===
1. Create 3 repository blueprints with README, CI/CD, structure
2. Define API contracts (OpenAPI schemas) between services
3. Migration plan for code extraction
4. Dockerfiles and docker-compose for each service
5. Communication protocol (REST/gRPC/event bus)

=== CONSTRAINTS ===
- Zero downtime migration required
- Backward compatibility for API v1
- Maintain git history where possible
- Document breaking changes

=== SUCCESS CRITERIA ===
- [ ] 3 repository templates created
- [ ] API contracts documented
- [ ] Migration runbook complete
- [ ] CI/CD configured for all 3
- [ ] Cross-service integration tested
