[Ver001.000]

# Emergency Memory Protocols — agent-gateway Disaster Recovery

**Owner:** Operations
**Plan reference:** `PLN-003-network-api` Phase 7-C
**Companion:** [`docs/operations/EXTERNAL_SERVICE_RECONCILIATION.md`](EXTERNAL_SERVICE_RECONCILIATION.md) — verified inventory of external accounts

---

## What this runbook is for

The Phase 3 SQLite blackboard is the agent-gateway's source of truth. If it's lost — disk failure, accidental `DELETE FROM tasks`, container ephemeral storage wiped on redeploy — agents lose their shared coordination context. This runbook lists the **recovery options in priority order**, plus the failure modes each one covers.

Phases that produce recovery artifacts:

| Phase | Artifact | Where | When written |
|---|---|---|---|
| **3** | Live SQLite DB | `services/agent-gateway/data/agent-gateway.db` (gitignored) | every API write |
| **3.5** | Supabase mirror | `agent_gateway_tasks` + `agent_gateway_contributions` in `NJZitegeiste` (`sxwyaxfresusroiezxxc`) | fire-and-forget after each local write |
| **7-B** | Local snapshot files | `services/agent-gateway/data/backups/agent-gateway-<UTC>.db` | operator cron (recommended daily) |

---

## Decision matrix — which fallback covers which failure

| Failure mode | Primary recovery | Notes |
|---|---|---|
| Container redeploy wipes ephemeral storage | **7-B local snapshot** if mounted on persistent volume; else **3.5 Supabase mirror** | Production should mount `data/` from a persistent volume |
| Disk failure on the host | **3.5 Supabase mirror** → restore via Supabase MCP | Local snapshots gone with the disk |
| Accidental `DELETE FROM tasks` | **7-B local snapshot** (most recent) | Fastest path; no network |
| SQLite file corruption | **7-B local snapshot** (last known good) | Walk back through dated snapshots |
| Supabase project lost / locked | **7-B local snapshot** + reseed Supabase via mirror tables | Local SQLite is the authoritative copy; cloud is the safety net |
| All three lost (worst case) | **Cloudflare R2 / Drive offsite** (operator-driven, manual) | Phase 7-C-deferred — sketched below |

---

## Procedure A — Restore from a Phase 7-B local snapshot

The fastest recovery (no network). Used when the gateway's `data/agent-gateway.db` is corrupt, deleted, or unreadable, but the `data/backups/` directory still exists.

```bash
# 1. Stop the gateway
sudo systemctl stop agent-gateway   # or: docker compose stop agent-gateway

# 2. Identify the most recent snapshot
ls -1t services/agent-gateway/data/backups/agent-gateway-*.db | head -5
# agent-gateway-20260518-040002.db   ← most recent (UTC)
# agent-gateway-20260517-040003.db
# agent-gateway-20260516-040001.db
# ...

# 3. Move aside the corrupt DB (don't delete — forensics)
mv services/agent-gateway/data/agent-gateway.db \
   services/agent-gateway/data/agent-gateway.db.broken-$(date -u +%Y%m%d-%H%M%S)

# 4. Copy the snapshot back into place
cp services/agent-gateway/data/backups/agent-gateway-20260518-040002.db \
   services/agent-gateway/data/agent-gateway.db

# 5. Verify integrity
sqlite3 services/agent-gateway/data/agent-gateway.db "PRAGMA integrity_check;"
# → ok

# 6. Restart the gateway
sudo systemctl start agent-gateway

# 7. Confirm /health reports correct counts
curl localhost:8001/health | jq
```

**Caveat:** all task lifecycle events between the snapshot timestamp and the restore are lost. If Supabase mirror is wired up, replay them via Procedure B.

---

## Procedure B — Restore from the Phase 3.5 Supabase mirror

Used when the local DB **and** all `data/backups/` snapshots are gone. The Supabase project is the offsite copy of every successful task write.

```sql
-- Run in the Supabase SQL editor (NJZitegeiste / sxwyaxfresusroiezxxc)
-- Export tasks
COPY (SELECT * FROM agent_gateway_tasks) TO STDOUT WITH CSV HEADER;
-- Export contributions
COPY (SELECT * FROM agent_gateway_contributions) TO STDOUT WITH CSV HEADER;
```

Or via the Supabase MCP (preferred in this session): use `execute_sql` to dump as JSON, then transform into SQLite INSERTs.

```bash
# After exporting JSON via MCP, transform with the helper:
python services/agent-gateway/scripts/restore_from_supabase.py \
    --tasks tasks.json \
    --contributions contributions.json \
    --out services/agent-gateway/data/agent-gateway.db
```

> **Note:** `restore_from_supabase.py` is a stub for Phase 7.5 / future work. For now, the manual path is: read the JSON, construct `INSERT INTO tasks (...) VALUES (...)` statements, run against a fresh SQLite DB.

**Caveat:** the Supabase mirror is fire-and-forget — there may be a few seconds of writes in the queue at the moment of failure that never reached Supabase. For most operational scenarios this is acceptable.

---

## Procedure C — Cold start (everything lost)

Worst-case: local DB gone, snapshots gone, Supabase mirror gone or unreachable. Documented for completeness; should be unreachable if Phase 7-B is operational.

```bash
# 1. Remove any partial state
rm -f services/agent-gateway/data/agent-gateway.db
rm -f services/agent-gateway/data/agent-gateway.db-wal
rm -f services/agent-gateway/data/agent-gateway.db-shm

# 2. Restart the gateway — it auto-bootstraps the schema on first use
sudo systemctl start agent-gateway

# 3. Verify empty state
curl localhost:8001/health | jq
# {"open_tasks": 0, "telemetry_subscriber": "running", ...}

# 4. Re-register agent keys (if `polyrepo/registry/index.json` was also lost)
# → run the Phase 1.6 key-gen runbook per lineage
# → docs/runbooks/AGENT_KEY_GENERATION.md
```

---

## Multi-platform fallback inventory

These platforms are already authenticated for this project (see `EXTERNAL_SERVICE_RECONCILIATION.md`) and could host offsite copies of the snapshots if operator wires it up. **None of these are auto-wired by Phase 7** — they're optional belts-and-suspenders.

| Platform | Account / project | Best-fit use | Wiring cost |
|---|---|---|---|
| **Supabase** | `NJZitegeiste` (`sxwyaxfresusroiezxxc`) | Mirror tables (Phase 3.5 already wired) | ✅ auto, env-gated |
| **Cloudflare R2** | account `fe15ca3d787f6793157af4bf374fd1f1` (empty) | Encrypted nightly snapshot bucket | manual — operator creates bucket, runs `aws s3 cp` from cron |
| **Vercel** | team `njzitegeiste`, project `website-v2` | Read-only mirror exposed as a static JSON endpoint for dashboards | manual — build step exports snapshot summary |
| **Google Drive** | operator's account | Encrypted weekly tarball | manual — `gdrive upload` or `rclone copy` |
| **Git (this repo)** | `services/agent-gateway/data/backups/` | ❌ DO NOT commit raw snapshots (gitignored). Use for `data/exports/` (sanitised dumps) only | n/a |

---

## Recommended cron schedule (Phase 7-B activation)

For production deployments once Phase 6 (Caddy + Compose prod) is live:

```cron
# 04:00 UTC daily — local snapshot + 14-day retention
0 4 * * * /usr/bin/python3 -m services.agent_gateway.backup_manager \
    --db /var/lib/agent-gateway/data/agent-gateway.db \
    --out /var/lib/agent-gateway/data/backups \
    --keep 14 \
    >> /var/log/agent-gateway-backup.log 2>&1

# 04:30 UTC weekly (Sunday) — offsite copy to Cloudflare R2 (if wired)
30 4 * * 0 aws s3 sync /var/lib/agent-gateway/data/backups \
    s3://zsxt-agent-gateway-backups/ \
    --endpoint-url https://fe15ca3d787f6793157af4bf374fd1f1.r2.cloudflarestorage.com \
    >> /var/log/agent-gateway-offsite.log 2>&1
```

---

## What's NOT in this runbook (deferred)

- **Active-active multi-region replication** — Phase 7+, requires running gateway instances behind a load balancer with conflict-resolution semantics
- **PITR (point-in-time recovery)** — would require continuous WAL shipping; current daily-snapshot model is sufficient for the gateway's write rate
- **Automated restore from Supabase** — Procedure B is currently manual; a `restore_from_supabase.py` helper is sketched but not shipped this round
- **Quarterly DR drill schedule** — operator owns; recommend running Procedure A monthly + Procedure B quarterly

---

## References

- Phase 3 SQLite WAL: `services/agent-gateway/blackboard.py` (PR #65)
- Phase 3.5 Supabase mirror: `services/agent-gateway/supabase_mirror.py` (PR #73)
- Phase 5 Pub/Sub: `services/agent-gateway/async_bus.py` (PR #72)
- Phase 7-A telemetry: `services/agent-gateway/telemetry_monitor.py` (PR #74)
- Phase 7-B backup CLI: `services/agent-gateway/backup_manager.py` (PR #75)
- Account inventory: `docs/operations/EXTERNAL_SERVICE_RECONCILIATION.md` (PR #43)
- Plan: `/root/.claude/plans/plan-and-draft-the-elegant-widget.md` §"Phase 7 — Telemetry + Multi-Platform Fallbacks"
