[Ver001.000]

# TRINITY + OPERA Deployment Infrastructure

This directory contains deployment configurations for the SATOR TRINITY + OPERA architecture.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRINITY + OPERA Architecture                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Component A   │  │   Component B   │  │   Component C   │             │
│  │  SQLite Queue   │  │  PostgreSQL     │  │  Turso Edge     │             │
│  │  (Task Queue)   │  │  (Primary OLTP) │  │  (Distributed)  │             │
│  │                 │  │                 │  │                 │             │
│  │  - Job queue    │  │  - Match data   │  │  - Edge cache   │             │
│  │  - Worker state │  │  - Player stats │  │  - Sync layer   │             │
│  │  - Task logs    │  │  - Analytics    │  │  - 540d retention│            │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └────────────────────┴────────────────────┘                       │
│                              │                                              │
│                         Harvester                                           │
│                    (VLR.gg Extraction)                                      │
│                              │                                              │
│                              ▼                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                     Component D: TiDB OPERA                          ││
│  │                        (Analytics/OLAP)                              ││
│  │                                                                      ││
│  │  - Time-series analysis        - Investment grading                  ││
│  │  - RAR decomposition           - 730d retention                      ││
│  │  - SimRating trending                                                ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

| Component | Technology | Purpose | Retention |
|-----------|------------|---------|-----------|
| **A** | SQLite (WAL mode) | Task queue, worker coordination | 30 days |
| **B** | PostgreSQL | Primary OLTP, match/player data | Configurable |
| **C** | Turso (libSQL) | Edge caching, distributed SQLite | 540 days |
| **D** | TiDB Cloud | Analytics, OLAP, reporting | 730 days |

## Directory Structure

```
infrastructure/
├── cron/
│   ├── sator-harvest          # Main cron job definitions
│   └── logrotate-sator        # Log rotation configuration
├── systemd/
│   └── sator-harvest.service  # Systemd service definition
├── scripts/
│   └── install-trinity.sh     # Installation script
└── README-TRINITY-OPERA.md    # This file
```

## Installation

### Quick Start

```bash
# Run the installation script
sudo ./infrastructure/scripts/install-trinity.sh production
```

### Manual Installation

#### 1. Install Cron Jobs

```bash
sudo cp infrastructure/cron/sator-harvest /etc/cron.d/sator-harvest
sudo chmod 644 /etc/cron.d/sator-harvest
```

#### 2. Install Systemd Service

```bash
sudo cp infrastructure/systemd/sator-harvest.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable sator-harvest
```

#### 3. Configure Log Rotation

```bash
sudo cp infrastructure/cron/logrotate-sator /etc/logrotate.d/sator-harvest
```

#### 4. Configure Environment

Edit `/opt/sator/.env` with your database credentials:

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/sator
QUEUE_DB_PATH=/var/lib/sator/queue.db

# Optional - TiDB OPERA
TIDB_HOST=gateway01.us-west-2.prod.aws.tidbcloud.com
TIDB_PORT=4000
TIDB_USER=your-user
TIDB_PASSWORD=your-password
TIDB_DATABASE=opera

# Optional - Turso Edge
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

## Cron Schedule

| Time | Job | Description |
|------|-----|-------------|
| `0 3 * * *` | Daily Harvest | Full VLR.gg extraction |
| `*/5 * * * *` | Worker Check | Ensure workers are healthy |
| `*/5 * * * *` | Turso Sync | Edge synchronization |
| `0 * * * *` | OPERA Sync | Analytics data sync |
| `*/15 * * * *` | Queue Maint | Cleanup completed tasks |
| `0 2 * * *` | Log Rotate | Rotate harvest logs |
| `0 4 * * 0` | Full Sync | Complete data reconciliation |
| `0 6 * * *` | Health Report | Send monitoring status |

## Service Management

```bash
# Start service
sudo systemctl start sator-harvest

# Stop service
sudo systemctl stop sator-harvest

# Restart service
sudo systemctl restart sator-harvest

# Check status
sudo systemctl status sator-harvest

# View logs
sudo journalctl -u sator-harvest -f
```

## Monitoring

### Check Queue Status

```bash
sudo -u sator sqlite3 /var/lib/sator/queue.db "
SELECT 
    status, 
    COUNT(*) as count,
    MAX(created_at) as latest
FROM tasks 
GROUP BY status;"
```

### Check Worker Health

```bash
sudo -u sator sqlite3 /var/lib/sator/queue.db "
SELECT 
    id,
    status,
    last_heartbeat,
    tasks_processed,
    tasks_failed
FROM workers;"
```

### View Harvest Logs

```bash
# Real-time logs
sudo tail -f /var/log/sator/harvest.log

# Cron job logs
sudo tail -f /var/log/sator/cron-daily.log
```

## Troubleshooting

### Service Won't Start

```bash
# Check for configuration errors
sudo -u sator /opt/sator/venv/bin/python -m axiom_esports_data.harvest.pre_flight

# Check environment file
sudo cat /opt/sator/.env

# Check permissions
sudo ls -la /var/lib/sator/
sudo ls -la /var/log/sator/
```

### Queue Database Issues

```bash
# Verify database integrity
sudo -u sator sqlite3 /var/lib/sator/queue.db "PRAGMA integrity_check;"

# Check WAL mode
sudo -u sator sqlite3 /var/lib/sator/queue.db "PRAGMA journal_mode;"

# Rebuild if corrupted (backup first!)
sudo cp /var/lib/sator/queue.db /var/lib/sator/queue.db.backup
sudo -u sator sqlite3 /var/lib/sator/queue.db ".recover" | sqlite3 /var/lib/sator/queue.db.new
```

### High Memory Usage

```bash
# Check worker count
ps aux | grep sator-harvest

# Adjust in .env
HARVEST_WORKERS=1
HARVEST_MAX_WORKERS=2
```

## Environment Variables

### Required

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | - | PostgreSQL connection string |
| `QUEUE_DB_PATH` | `/var/lib/sator/queue.db` | SQLite queue database path |

### Optional - TiDB OPERA

| Variable | Description |
|----------|-------------|
| `TIDB_HOST` | TiDB Cloud gateway host |
| `TIDB_PORT` | TiDB Cloud port (usually 4000) |
| `TIDB_USER` | Database username |
| `TIDB_PASSWORD` | Database password |
| `TIDB_DATABASE` | Database name (default: opera) |

### Optional - Turso Edge

| Variable | Description |
|----------|-------------|
| `TURSO_DATABASE_URL` | libSQL connection URL |
| `TURSO_AUTH_TOKEN` | Authentication token |
| `TURSO_RETENTION_DAYS` | Data retention (default: 540) |

### Harvester Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VLR_RATE_LIMIT` | 2 | Requests per second |
| `VLR_MAX_RETRIES` | 3 | Max retry attempts |
| `HARVEST_WORKERS` | 2 | Number of worker processes |
| `LOG_LEVEL` | INFO | Logging level |

## Security Considerations

1. **File Permissions**: Environment files should be `640` (owner read/write, group read)
2. **Database Credentials**: Never commit `.env` files
3. **Queue Database**: SQLite database should be `640` permissions
4. **Log Files**: Ensure logs don't contain sensitive data
5. **Rate Limiting**: Respect VLR.gg rate limits to avoid blocking

## Backup Strategy

### SQLite Task Queue

```bash
# Daily backup
0 1 * * * sator sqlite3 /var/lib/sator/queue.db ".backup '/var/backups/sator/queue-$(date +\%Y\%m\%d).db'"

# Keep 7 days of backups
0 2 * * * sator find /var/backups/sator/ -name 'queue-*.db' -mtime +7 -delete
```

### Configuration

```bash
# Backup .env file
sudo cp /opt/sator/.env /var/backups/sator/env-backup-$(date +%Y%m%d)
```

## License

Part of the Libre-X-eSport 4NJZ4 TENET Platform.
See LICENSE file for details.
