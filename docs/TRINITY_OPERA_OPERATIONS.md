[Ver001.000]

# TRINITY + OPERA Operations Guide

**Production Deployment and Day-to-Day Operations Manual**

---

## Table of Contents

1. [Installation Instructions](#installation-instructions)
2. [Environment Setup](#environment-setup)
3. [Database Initialization](#database-initialization)
4. [Cron Job Configuration](#cron-job-configuration)
5. [Systemd Service Setup](#systemd-service-setup)
6. [Monitoring and Alerting](#monitoring-and-alerting)
7. [Backup Procedures](#backup-procedures)
8. [Troubleshooting](#troubleshooting)
9. [Scaling Considerations](#scaling-considerations)

---

## Installation Instructions

### System Requirements

**Minimum Requirements**:
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB SSD
- OS: Ubuntu 22.04 LTS, Debian 12, or RHEL 9+
- Python: 3.11+
- PostgreSQL: 14+

**Recommended Production**:
- CPU: 4+ cores
- RAM: 8 GB
- Storage: 50 GB SSD
- Network: 1 Gbps

### Quick Install (Automated)

```bash
# 1. Clone the repository
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE

# 2. Run the installation script
sudo ./infrastructure/scripts/install-trinity.sh production

# 3. Follow interactive prompts for:
#    - Database credentials
#    - API keys (VLR.gg, Riot)
#    - Component D (TiDB) configuration
```

### Manual Installation

#### Step 1: System Dependencies

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install -y \
    python3-venv \
    python3-pip \
    python3-dev \
    build-essential \
    libpq-dev \
    sqlite3 \
    logrotate \
    curl \
    jq \
    git \
    postgresql-client
```

**RHEL/CentOS/Rocky**:
```bash
sudo dnf install -y \
    python3-virtualenv \
    python3-pip \
    python3-devel \
    gcc \
    postgresql-devel \
    sqlite \
    logrotate \
    curl \
    jq \
    git \
    postgresql-server
```

#### Step 2: Create SATOR User

```bash
# Create dedicated user
sudo useradd --system \
    --user-group \
    --home-dir /opt/sator \
    --shell /bin/bash \
    sator

# Create directories
sudo mkdir -p /opt/sator/data/raw_extractions
sudo mkdir -p /opt/sator/logs
sudo mkdir -p /var/lib/sator
sudo mkdir -p /var/log/sator
sudo mkdir -p /etc/sator

# Set permissions
sudo chown -R sator:sator /opt/sator
sudo chown -R sator:sator /var/lib/sator
sudo chown -R sator:sator /var/log/sator
sudo chmod 750 /var/lib/sator
```

#### Step 3: Python Environment

```bash
# Switch to sator user
sudo su - sator

# Create virtual environment
python3 -m venv /opt/sator/venv
source /opt/sator/venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install dependencies
cd /opt/sator
pip install \
    asyncpg \
    aiosqlite \
    libsql-client \
    pymysql \
    httpx \
    pydantic \
    pydantic-settings \
    structlog \
    tenacity \
    python-dotenv

# Install package
cd axiom-esports-data
pip install -e .
```

---

## Environment Setup

### Configuration File

Create `/opt/sator/.env`:

```bash
# ============================================
# SATOR TRINITY + OPERA Environment Configuration
# ============================================

# Application Settings
APP_ENV=production
LOG_LEVEL=INFO
DEBUG=false

# ============================================
# COMPONENT A: SQLite Task Queue
# ============================================
QUEUE_DB_PATH=/var/lib/sator/queue.db
HARVEST_WORKERS=4
HARVEST_POLL_INTERVAL=1.0

# ============================================
# COMPONENT B: PostgreSQL Primary
# ============================================
DATABASE_URL=postgresql://sator:${DB_PASSWORD}@localhost:5432/sator_analytics
POSTGRES_POOL_MIN=2
POSTGRES_POOL_MAX=10
POSTGRES_TIMEOUT=60

# Raw data storage
RAW_STORAGE_PATH=/opt/sator/data/raw_extractions

# ============================================
# COMPONENT C: Turso Edge
# ============================================
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
TURSO_SYNC_INTERVAL=300
TURSO_BATCH_SIZE=1000
TURSO_RETENTION_MONTHS=18

# ============================================
# COMPONENT D: TiDB OPERA
# ============================================
TIDB_HOST=gateway.xxx.us-east-1.prod.aws.tidbcloud.com
TIDB_PORT=4000
TIDB_USER=opera
TIDB_PASSWORD=${TIDB_PASSWORD}
TIDB_DATABASE=opera_metadata
TIDB_POOL_SIZE=5

# ============================================
# External API Configuration
# ============================================
VLR_RATE_LIMIT=2
VLR_BASE_URL=https://www.vlr.gg
RIOT_API_KEY=${RIOT_API_KEY}
HLTV_RATE_LIMIT=1

# ============================================
# Logging
# ============================================
LOG_FILE=/var/log/sator/harvest.log
LOG_FORMAT=json
LOG_ROTATION=1 day
LOG_RETENTION=30 days

# ============================================
# Security
# ============================================
SECRET_KEY=${GENERATE_RANDOM_KEY}
ALLOWED_HOSTS=localhost,api.sator.io
CORS_ORIGINS=https://sator.io,https://app.sator.io

# ============================================
# Monitoring
# ============================================
HEALTH_CHECK_INTERVAL=60
METRICS_ENABLED=true
SENTRY_DSN=${SENTRY_DSN_OPTIONAL}
```

### Generate Secrets

```bash
# Generate secure random keys
DB_PASSWORD=$(openssl rand -base64 32)
TIDB_PASSWORD=$(openssl rand -base64 32)
SECRET_KEY=$(openssl rand -hex 32)

echo "DB_PASSWORD=$DB_PASSWORD"
echo "TIDB_PASSWORD=$TIDB_PASSWORD"
echo "SECRET_KEY=$SECRET_KEY"
```

### File Permissions

```bash
sudo chown sator:sator /opt/sator/.env
sudo chmod 640 /opt/sator/.env
```

---

## Database Initialization

### Component B: PostgreSQL

#### Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database
CREATE DATABASE sator_analytics;

-- Create user
CREATE USER sator WITH PASSWORD 'your_secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE sator_analytics TO sator;

-- Enable required extensions
\c sator_analytics
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Exit
\q
```

#### Apply Migrations

```bash
# Run migrations
sudo -u sator /opt/sator/venv/bin/python \
    -m axiom_esports_data.scripts.run_migrations \
    --database-url "$DATABASE_URL"
```

**Migration Files** (in order):
1. `001_initial_schema.sql` - Base tables
2. `002_sator_layers.sql` - Layer definitions
3. `003_dual_storage.sql` - Twin-table setup
4. `004_extraction_log.sql` - Audit logging
5. `005_staging_system.sql` - Staging tables
6. `012_materialized_views.sql` - Performance views

### Component A: SQLite Task Queue

```bash
# Initialize queue database
sudo -u sator sqlite3 /var/lib/sator/queue.db << 'EOF'
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;

-- Schema is auto-created by SQLiteTaskQueue class
-- Verify initialization
.tables
EOF

# Set permissions
sudo chown sator:sator /var/lib/sator/queue.db
sudo chmod 640 /var/lib/sator/queue.db
```

### Component C: Turso

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Authenticate
turso auth login

# Create database
turso db create sator-edge --group sator

# Get connection details
turso db show sator-edge

# Apply schema
turso db shell sator-edge < \
    packages/shared/axiom-esports-data/infrastructure/turso_schema.sql

# Generate auth token
turso db tokens create sator-edge
```

### Component D: TiDB OPERA

**Option 1: TiDB Cloud Serverless**:
```bash
# Sign up at https://tidbcloud.com
# Create cluster
# Get connection parameters from dashboard
```

**Option 2: Self-Hosted**:
```bash
# Deploy TiDB cluster
# Create database
mysql -h $TIDB_HOST -P $TIDB_PORT -u root -p << 'EOF'
CREATE DATABASE IF NOT EXISTS opera_metadata;
CREATE USER IF NOT EXISTS 'opera'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON opera_metadata.* TO 'opera'@'%';
FLUSH PRIVILEGES;
EOF
```

**Apply Schema**:
```bash
mysql -h $TIDB_HOST -P $TIDB_PORT -u opera -p opera_metadata < \
    packages/shared/axiom-esports-data/infrastructure/opera_schema.sql
```

---

## Cron Job Configuration

### Installation

```bash
# Copy cron file
sudo cp infrastructure/cron/sator-harvest /etc/cron.d/sator-harvest
sudo chmod 644 /etc/cron.d/sator-harvest

# Verify syntax
sudo crontab -l -u sator
```

### Cron Schedule

```cron
#!/bin/bash
# /etc/cron.d/sator-harvest
# SATOR TRINITY + OPERA Harvest Cron Jobs

SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
USER=sator
HOME=/opt/sator

# Daily Harvest - 3:00 AM UTC
0 3 * * * sator cd /opt/sator && /opt/sator/venv/bin/python -m axiom_esports_data.harvest.orchestrator --mode daily >> /var/log/sator/cron-daily.log 2>&1

# Worker Health Check - Every 5 minutes
*/5 * * * * sator cd /opt/sator && /opt/sator/venv/bin/python -m axiom_esports_data.harvest.worker --check >> /var/log/sator/cron-worker-check.log 2>&1

# Turso Edge Sync - Every 5 minutes
*/5 * * * * sator cd /opt/sator && /opt/sator/venv/bin/python -m axiom_esports_data.sync.turso_sync >> /var/log/sator/cron-turso-sync.log 2>&1

# OPERA Analytics Sync - Hourly
0 * * * * sator cd /opt/sator && /opt/sator/venv/bin/python -m axiom_esports_data.sync.opera_sync >> /var/log/sator/cron-opera-sync.log 2>&1

# Queue Maintenance - Every 15 minutes
*/15 * * * * sator cd /opt/sator && /opt/sator/venv/bin/python -m axiom_esports_data.queue.maintenance --retention-days 30 >> /var/log/sator/cron-queue-maint.log 2>&1

# Log Rotation - Daily at 2:00 AM
0 2 * * * root /usr/sbin/logrotate -f /etc/logrotate.d/sator-harvest >> /var/log/sator/cron-logrotate.log 2>&1

# Weekly Full Sync - Sunday at 4:00 AM
0 4 * * 0 sator cd /opt/sator && /opt/sator/venv/bin/python -m axiom_esports_data.sync.full_sync >> /var/log/sator/cron-full-sync.log 2>&1

# Health Check Report - Daily at 6:00 AM
0 6 * * * sator cd /opt/sator && /opt/sator/venv/bin/python -m axiom_esports_data.monitoring.health_check --report >> /var/log/sator/cron-health.log 2>&1
```

### Cron Job Descriptions

| Job | Schedule | Purpose |
|-----|----------|---------|
| Daily Harvest | 3:00 AM UTC | Full VLR.gg extraction |
| Worker Health | Every 5 min | Ensure workers running |
| Turso Sync | Every 5 min | Edge cache update |
| OPERA Sync | Hourly | Tournament metadata sync |
| Queue Maint | Every 15 min | Cleanup old tasks |
| Log Rotate | 2:00 AM | Rotate logs |
| Weekly Sync | Sunday 4:00 AM | Full reconciliation |
| Health Report | 6:00 AM | Status notification |

---

## Systemd Service Setup

### Service File

Create `/etc/systemd/system/sator-harvest.service`:

```ini
[Unit]
Description=SATOR TRINITY+OPERA Harvest Orchestrator
Documentation=https://github.com/notbleaux/eSports-EXE/wiki/Harvest-Architecture
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=sator
Group=sator
WorkingDirectory=/opt/sator
EnvironmentFile=/opt/sator/.env

# Pre-start checks
ExecStartPre=/bin/mkdir -p /var/lib/sator /var/log/sator
ExecStartPre=/bin/chown sator:sator /var/lib/sator /var/log/sator
ExecStartPre=/opt/sator/venv/bin/python -m axiom_esports_data.harvest.pre_flight

# Main process
ExecStart=/opt/sator/venv/bin/python -m axiom_esports_data.harvest.orchestrator \
    --workers ${HARVEST_WORKERS:-2} \
    --queue-db ${QUEUE_DB_PATH:-/var/lib/sator/queue.db} \
    --log-file ${LOG_FILE:-/var/log/sator/harvest.log}

# Restart configuration
Restart=always
RestartSec=10
StartLimitInterval=60
StartLimitBurst=3

# Graceful shutdown
TimeoutStopSec=60
KillSignal=SIGTERM
SendSIGKILL=yes

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

# Security
NoNewPrivileges=false
ProtectSystem=false
ProtectHome=false
ReadWritePaths=/var/lib/sator /var/log/sator

# Logging
StandardOutput=append:/var/log/sator/harvest.stdout.log
StandardError=append:/var/log/sator/harvest.stderr.log
SyslogIdentifier=sator-harvest

[Install]
WantedBy=multi-user.target
```

### Service Management

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable sator-harvest

# Start service
sudo systemctl start sator-harvest

# Check status
sudo systemctl status sator-harvest

# View logs
sudo journalctl -u sator-harvest -f

# Restart
sudo systemctl restart sator-harvest

# Stop
sudo systemctl stop sator-harvest
```

### Log Rotation

Create `/etc/logrotate.d/sator-harvest`:

```
/var/log/sator/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 sator sator
    sharedscripts
    postrotate
        /bin/kill -HUP $(cat /var/run/syslogd.pid 2> /dev/null) 2> /dev/null || true
    endscript
}
```

---

## Monitoring and Alerting

### Health Check Commands

**Component A - SQLite Queue**:
```bash
# Queue depth
sudo -u sator sqlite3 /var/lib/sator/queue.db \
    "SELECT status, COUNT(*) FROM task_queue GROUP BY status;"

# Recent failures
sudo -u sator sqlite3 /var/lib/sator/queue.db \
    "SELECT COUNT(*) FROM failed_tasks WHERE failed_at > datetime('now', '-1 hour');"
```

**Component B - PostgreSQL**:
```bash
# Connection count
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Table sizes
psql $DATABASE_URL -c "
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname='public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Slow queries
psql $DATABASE_URL -c "
SELECT query, calls, mean_time, total_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"
```

**Component C - Turso**:
```bash
# Sync status
/opt/sator/venv/bin/python -c "
import asyncio
from api.src.edge.turso_sync import TursoEdgeSync

async def check():
    sync = TursoEdgeSync()
    await sync.initialize()
    status = await sync.get_sync_status()
    print(status)
    await sync.close()

asyncio.run(check())
"
```

**Component D - TiDB**:
```bash
# Connection test
mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -p -e "SELECT 1;"

# Table statistics
mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -p opera_metadata -e "
SELECT table_name, table_rows, data_length/1024/1024 as data_mb 
FROM information_schema.tables 
WHERE table_schema='opera_metadata';
"
```

### Monitoring Dashboard

```bash
# Start dev dashboard
/opt/sator/venv/bin/python -m axiom_esports_data.monitoring.dev_dashboard

# Access at http://localhost:8080
```

### Alerting Rules

**Prometheus-style Alerts**:

```yaml
groups:
  - name: sator_alerts
    rules:
      - alert: HighQueueDepth
        expr: sator_queue_pending > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High task queue depth"
          
      - alert: ComponentC_SyncLag
        expr: sator_turso_sync_lag_seconds > 900
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Turso sync lag exceeds 15 minutes"
          
      - alert: ComponentD_Unreachable
        expr: sator_opera_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "TiDB OPERA is unreachable"
          
      - alert: DailyHarvestFailed
        expr: sator_daily_harvest_success == 0
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Daily harvest has not completed successfully"
```

---

## Backup Procedures

### Component A - SQLite Queue

```bash
#!/bin/bash
# backup_queue.sh

BACKUP_DIR="/backup/sator/queue"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup with SQLite
sudo -u sator sqlite3 /var/lib/sator/queue.db \
    ".backup '$BACKUP_DIR/queue_$DATE.db'"

# Compress
gzip $BACKUP_DIR/queue_$DATE.db

# Keep only last 7 days
find $BACKUP_DIR -name "queue_*.db.gz" -mtime +7 -delete
```

### Component B - PostgreSQL

```bash
#!/bin/bash
# backup_postgres.sh

BACKUP_DIR="/backup/sator/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Full backup
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/sator_$DATE.sql.gz

# Keep last 30 daily backups
find $BACKUP_DIR -name "sator_*.sql.gz" -mtime +30 -delete
```

**Automated with Cron**:
```cron
# Daily backup at 1:00 AM
0 1 * * * sator /opt/sator/scripts/backup_postgres.sh
```

### Component C - Turso

```bash
# Turso provides automatic backups
# For manual export:
turso db dump sator-edge > backup.sql
```

### Component D - TiDB

```bash
# Using Dumpling (TiDB export tool)
dumpling -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -p $TIDB_PASSWORD \
    -B opera_metadata -o /backup/sator/opera/
```

### Disaster Recovery

**Restore Component A**:
```bash
sudo systemctl stop sator-harvest
cp /backup/sator/queue/queue_20260315_010000.db /var/lib/sator/queue.db
sudo chown sator:sator /var/lib/sator/queue.db
sudo systemctl start sator-harvest
```

**Restore Component B**:
```bash
# Drop and recreate database
dropdb sator_analytics
createdb sator_analytics

# Restore
gunzip < /backup/sator/postgres/sator_20260315_010000.sql.gz | psql sator_analytics
```

---

## Troubleshooting

### Common Issues

#### Issue: Queue Not Processing Tasks

**Symptoms**: Tasks remain in `pending` status

**Diagnosis**:
```bash
# Check worker status
sudo systemctl status sator-harvest

# Check for errors
sudo tail -f /var/log/sator/harvest.log

# Verify queue is accessible
sudo -u sator sqlite3 /var/lib/sator/queue.db ".tables"
```

**Solutions**:
1. Restart service: `sudo systemctl restart sator-harvest`
2. Check worker registration in logs
3. Verify database permissions

#### Issue: Component C Sync Lag

**Symptoms**: `sync_lag_seconds` > 300

**Diagnosis**:
```bash
# Check PostgreSQL connectivity
/opt/sator/venv/bin/python -c "import asyncpg; ..."

# Check Turso connectivity
curl -H "Authorization: Bearer $TURSO_AUTH_TOKEN" \
    $TURSO_DATABASE_URL/v2/pipeline
```

**Solutions**:
1. Check network connectivity
2. Verify auth tokens
3. Increase batch size if behind
4. Check PostgreSQL load

#### Issue: Component D Connection Errors

**Symptoms**: `TiDBOperaClient` connection failures

**Diagnosis**:
```bash
# Test connection
mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -p -e "SELECT 1;"

# Check TiDB Cloud status
# Visit https://status.tidbcloud.com
```

**Solutions**:
1. Verify credentials in `.env`
2. Check IP allowlist in TiDB Cloud
3. Test with `telnet $TIDB_HOST $TIDB_PORT`
4. Review connection limits

#### Issue: High Disk Usage

**Symptoms**: Disk >80% full

**Diagnosis**:
```bash
# Check usage by directory
du -sh /var/lib/sator/* /var/log/sator/* /opt/sator/data/*

# Check PostgreSQL size
psql $DATABASE_URL -c "
SELECT pg_size_pretty(pg_database_size('sator_analytics'));
"
```

**Solutions**:
1. Run queue cleanup: `python -m scheduler cleanup --days 7`
2. Archive old PostgreSQL partitions
3. Reduce log retention
4. Compress raw extractions

### Debug Mode

Enable verbose logging:

```bash
# Edit .env
LOG_LEVEL=DEBUG

# Restart
sudo systemctl restart sator-harvest

# Watch detailed logs
sudo tail -f /var/log/sator/harvest.log | jq .
```

### Emergency Procedures

**Complete Restart**:
```bash
# Stop all services
sudo systemctl stop sator-harvest

# Clear stuck tasks (if needed)
sudo -u sater sqlite3 /var/lib/sator/queue.db \
    "UPDATE task_queue SET status='pending' WHERE status='running';"

# Start services
sudo systemctl start sator-harvest
```

**Component Isolation**:
```bash
# Disable Component C sync temporarily
# Edit .env: TURSO_SYNC_INTERVAL=999999

# Restart
sudo systemctl restart sator-harvest
```

---

## Scaling Considerations

### Horizontal Scaling

**Component A - SQLite Limitations**:
- SQLite works best on single server
- For multi-server: Consider migration to PostgreSQL queue or Redis

**Component B - PostgreSQL**:
```bash
# Add read replica
# Update connection string to use replica for reads
DATABASE_URL_REPLICA=postgresql://...replica...
```

**Component C - Turso**:
- Turso scales automatically
- No action needed

**Component D - TiDB**:
- TiDB is distributed by design
- Scale by adding nodes

### Vertical Scaling

**Increase Workers**:
```bash
# Edit /opt/sator/.env
HARVEST_WORKERS=8

# Restart
sudo systemctl restart sator-harvest
```

**Increase Connection Pools**:
```bash
# Component B
POSTGRES_POOL_MAX=20

# Component D
TIDB_POOL_SIZE=10
```

### Performance Tuning

**PostgreSQL**:
```sql
-- Adjust for your hardware
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET work_mem = '50MB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
```

**SQLite**:
```sql
-- Already optimized in code
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=-64000;  -- 64MB
```

### Capacity Planning

| Metric | Current | Scale Trigger | Action |
|--------|---------|---------------|--------|
| Queue depth | <100 | >10,000 | Add workers |
| DB storage | ~1GB | >8GB | Archive cold data |
| Turso records | ~500K | >5M | Review retention |
| TiDB size | <100MB | >1GB | Optimize indexes |

---

## Maintenance Windows

### Recommended Schedule

| Task | Frequency | Duration | Impact |
|------|-----------|----------|--------|
| Log rotation | Daily | 1 min | None |
| Queue cleanup | Daily | 5 min | None |
| Full backup | Daily | 30 min | Low |
| PostgreSQL VACUUM | Weekly | 1 hour | Medium |
| Index rebuild | Monthly | 2 hours | High |
| Component upgrades | Quarterly | 4 hours | High |

### Pre-Maintenance Checklist

- [ ] Notify stakeholders
- [ ] Verify backups
- [ ] Check queue status (should be near 0)
- [ ] Document rollback plan
- [ ] Schedule during low-traffic period

---

## Support and Resources

### Documentation
- Architecture: `docs/TRINITY_OPERA_ARCHITECTURE.md`
- API Reference: `docs/TRINITY_OPERA_API.md`
- GitHub Wiki: https://github.com/notbleaux/eSports-EXE/wiki

### Community
- Discord: [Link]
- Issues: https://github.com/notbleaux/eSports-EXE/issues

### Emergency Contacts
- On-call: [Your contact]
- Database Admin: [Contact]
- Infrastructure: [Contact]

---

*Document Version: [Ver001.000]*
*Last Updated: 2026-03-15*
*Maintainer: SATOR Operations Team*
