#!/bin/bash
# SATOR TRINITY + OPERA Installation Script
# Version: [Ver001.000]
# Usage: sudo ./install-trinity.sh [environment]
# Environments: production (default), staging, development

set -euo pipefail

# ============================================
# Configuration
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
INSTALL_ENV="${1:-production}"
SATOR_USER="sator"
SATOR_HOME="/opt/sator"
SATOR_LIB="/var/lib/sator"
SATOR_LOG="/var/log/sator"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# Logging Functions
# ============================================
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# Pre-flight Checks
# ============================================
log_info "Starting TRINITY + OPERA installation..."
log_info "Environment: ${INSTALL_ENV}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

# Check OS
if [[ ! -f /etc/os-release ]]; then
    log_error "Cannot determine OS version"
    exit 1
fi

source /etc/os-release
log_info "Detected OS: ${NAME} ${VERSION_ID}"

# Check Python version
if ! command -v python3 &> /dev/null; then
    log_error "Python 3 is not installed"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
log_info "Python version: ${PYTHON_VERSION}"

# ============================================
# Install System Dependencies
# ============================================
log_info "Installing system dependencies..."

if [[ "$ID" == "ubuntu" || "$ID" == "debian" ]]; then
    apt-get update
    apt-get install -y \
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
elif [[ "$ID" == "centos" || "$ID" == "rhel" || "$ID" == "fedora" || "$ID" == "rocky" || "$ID" == "almalinux" ]]; then
    dnf install -y \
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
        postgresql
else
    log_warn "Unsupported OS. Please install dependencies manually."
fi

# ============================================
# Create SATOR User
# ============================================
log_info "Creating sator user..."

if ! id -u ${SATOR_USER} &>/dev/null; then
    useradd --system --user-group --home-dir ${SATOR_HOME} --shell /bin/bash ${SATOR_USER}
    log_info "Created user: ${SATOR_USER}"
else
    log_warn "User ${SATOR_USER} already exists"
fi

# ============================================
# Create Directories
# ============================================
log_info "Creating directories..."

mkdir -p ${SATOR_HOME}/data/raw_extractions
mkdir -p ${SATOR_HOME}/logs
mkdir -p ${SATOR_LIB}
mkdir -p ${SATOR_LOG}
mkdir -p /etc/sator

chown -R ${SATOR_USER}:${SATOR_USER} ${SATOR_HOME}
chown -R ${SATOR_USER}:${SATOR_USER} ${SATOR_LIB}
chown -R ${SATOR_USER}:${SATOR_USER} ${SATOR_LOG}

chmod 755 ${SATOR_HOME}
chmod 750 ${SATOR_LIB}
chmod 755 ${SATOR_LOG}

log_info "Directories created successfully"

# ============================================
# Copy Application Code
# ============================================
log_info "Installing application code..."

# Copy data package
DATA_PACKAGE="${PROJECT_ROOT}/packages/shared/axiom-esports-data"
if [[ -d "${DATA_PACKAGE}" ]]; then
    cp -r ${DATA_PACKAGE} ${SATOR_HOME}/
    chown -R ${SATOR_USER}:${SATOR_USER} ${SATOR_HOME}/axiom-esports-data
    log_info "Copied axiom-esports-data package"
else
    log_error "Data package not found at ${DATA_PACKAGE}"
    exit 1
fi

# ============================================
# Setup Python Virtual Environment
# ============================================
log_info "Setting up Python virtual environment..."

cd ${SATOR_HOME}
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install dependencies
if [[ -f "axiom-esports-data/requirements.txt" ]]; then
    pip install -r axiom-esports-data/requirements.txt
    log_info "Installed Python dependencies"
else
    log_warn "requirements.txt not found, installing core packages..."
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
fi

# Install the package in editable mode
cd axiom-esports-data
pip install -e .

deactivate

chown -R ${SATOR_USER}:${SATOR_USER} ${SATOR_HOME}/venv

log_info "Python environment configured"

# ============================================
# Initialize SQLite Task Queue Database
# ============================================
log_info "Initializing SQLite Task Queue database..."

QUEUE_DB_PATH="${SATOR_LIB}/queue.db"

# Create initial schema
sudo -u ${SATOR_USER} sqlite3 ${QUEUE_DB_PATH} << 'EOF'
-- TRINITY Task Queue Schema
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_type TEXT NOT NULL,
    payload JSON NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    worker_id TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    FOREIGN KEY (worker_id) REFERENCES workers(id)
);

CREATE TABLE IF NOT EXISTS workers (
    id TEXT PRIMARY KEY,
    hostname TEXT NOT NULL,
    pid INTEGER NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    tasks_processed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tasks_worker ON tasks(worker_id);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_task_logs_task ON task_logs(task_id);

-- Cleanup old completed tasks (keep 30 days)
CREATE TRIGGER IF NOT EXISTS cleanup_old_tasks
AFTER INSERT ON tasks
WHEN (SELECT COUNT(*) FROM tasks WHERE status = 'completed' AND completed_at < datetime('now', '-30 days')) > 0
BEGIN
    DELETE FROM tasks WHERE status = 'completed' AND completed_at < datetime('now', '-30 days');
END;
EOF

chown ${SATOR_USER}:${SATOR_USER} ${QUEUE_DB_PATH}
chmod 640 ${QUEUE_DB_PATH}

log_info "SQLite Task Queue initialized at ${QUEUE_DB_PATH}"

# ============================================
# Setup Environment Configuration
# ============================================
log_info "Setting up environment configuration..."

ENV_FILE="${SATOR_HOME}/.env"

if [[ -f "axiom-esports-data/.env.example" ]]; then
    # Copy and customize .env.example
    cp axiom-esports-data/.env.example ${ENV_FILE}
    
    # Update paths for production
    sed -i "s|QUEUE_DB_PATH=.*|QUEUE_DB_PATH=${QUEUE_DB_PATH}|" ${ENV_FILE}
    sed -i "s|RAW_STORAGE_PATH=.*|RAW_STORAGE_PATH=${SATOR_HOME}/data/raw_extractions|" ${ENV_FILE}
    sed -i "s|LOG_FILE=.*|LOG_FILE=${SATOR_LOG}/harvest.log|" ${ENV_FILE}
    
    chown ${SATOR_USER}:${SATOR_USER} ${ENV_FILE}
    chmod 640 ${ENV_FILE}
    
    log_info "Environment file created at ${ENV_FILE}"
    log_warn "Please edit ${ENV_FILE} to configure database credentials and API keys"
else
    log_warn ".env.example not found, creating minimal .env file"
    cat > ${ENV_FILE} << EOF
# SATOR TRINITY + OPERA Configuration
QUEUE_DB_PATH=${QUEUE_DB_PATH}
RAW_STORAGE_PATH=${SATOR_HOME}/data/raw_extractions
LOG_FILE=${SATOR_LOG}/harvest.log
LOG_LEVEL=INFO
HARVEST_WORKERS=2
VLR_RATE_LIMIT=2
EOF
    chown ${SATOR_USER}:${SATOR_USER} ${ENV_FILE}
    chmod 640 ${ENV_FILE}
fi

# ============================================
# Setup Logrotate
# ============================================
log_info "Configuring log rotation..."

cat > /etc/logrotate.d/sator-harvest << 'EOF'
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
EOF

log_info "Logrotate configured"

# ============================================
# Setup Systemd Service
# ============================================
log_info "Configuring systemd service..."

SERVICE_FILE="${PROJECT_ROOT}/infrastructure/systemd/sator-harvest.service"
if [[ -f "${SERVICE_FILE}" ]]; then
    cp ${SERVICE_FILE} /etc/systemd/system/
    systemctl daemon-reload
    log_info "Systemd service installed"
else
    log_warn "Service file not found at ${SERVICE_FILE}"
fi

# ============================================
# Setup Cron Jobs
# ============================================
log_info "Configuring cron jobs..."

CRON_FILE="${PROJECT_ROOT}/infrastructure/cron/sator-harvest"
if [[ -f "${CRON_FILE}" ]]; then
    cp ${CRON_FILE} /etc/cron.d/sator-harvest
    chmod 644 /etc/cron.d/sator-harvest
    log_info "Cron jobs installed"
else
    log_warn "Cron file not found at ${CRON_FILE}"
fi

# ============================================
# Post-Installation Summary
# ============================================
log_info "============================================"
log_info "TRINITY + OPERA Installation Complete!"
log_info "============================================"
echo ""
echo "Installation Details:"
echo "  - Environment: ${INSTALL_ENV}"
echo "  - User: ${SATOR_USER}"
echo "  - Home Directory: ${SATOR_HOME}"
echo "  - Data Directory: ${SATOR_LIB}"
echo "  - Log Directory: ${SATOR_LOG}"
echo "  - Queue Database: ${QUEUE_DB_PATH}"
echo ""
echo "Next Steps:"
echo "  1. Edit configuration: sudo nano ${SATOR_HOME}/.env"
echo "  2. Configure PostgreSQL database connection"
echo "  3. Configure TiDB OPERA connection (optional)"
echo "  4. Configure Turso Edge (optional)"
echo "  5. Start the service: sudo systemctl start sator-harvest"
echo "  6. Enable at boot: sudo systemctl enable sator-harvest"
echo "  7. Check status: sudo systemctl status sator-harvest"
echo ""
echo "Useful Commands:"
echo "  - View logs: sudo tail -f ${SATOR_LOG}/harvest.log"
echo "  - Check queue: sudo -u sator sqlite3 ${QUEUE_DB_PATH} 'SELECT status, COUNT(*) FROM tasks GROUP BY status;'"
echo "  - Manual harvest: sudo -u sator ${SATOR_HOME}/venv/bin/python -m axiom_esports_data.harvest.orchestrator --mode daily"
echo ""

if [[ "${INSTALL_ENV}" == "production" ]]; then
    log_warn "Production Installation Notes:"
    echo "  - Ensure PostgreSQL is running and accessible"
    echo "  - Configure firewall rules for database access"
    echo "  - Set up monitoring and alerting"
    echo "  - Configure backup for ${SATOR_LIB}/queue.db"
    echo "  - Review and adjust VLR_RATE_LIMIT based on your plan"
fi

exit 0
