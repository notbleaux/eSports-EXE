#!/bin/bash
# [Ver001.001]
# SATOR Database Migration Runner Script
# Runs all SQL migrations in order for Render deployment
# Usage: ./scripts/run-migrations.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get environment (default: production)
ENVIRONMENT=${1:-production}
log_info "Running migrations for environment: $ENVIRONMENT"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set!"
    log_error "Please set it to your PostgreSQL connection string."
    exit 1
fi

log_info "Database URL is configured"

# Migration directories
API_MIGRATIONS_DIR="packages/shared/api/migrations"

# Check if migration directories exist
if [ ! -d "$API_MIGRATIONS_DIR" ]; then
    log_error "API migrations directory not found: $API_MIGRATIONS_DIR"
    exit 1
fi

log_info "Found API migrations directory"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        log_error "Python is not installed or not in PATH"
        exit 1
    fi
    PYTHON_CMD="python"
else
    PYTHON_CMD="python3"
fi

log_info "Using Python: $PYTHON_CMD"

# Check if asyncpg is installed
if ! $PYTHON_CMD -c "import asyncpg" 2>/dev/null; then
    log_warn "asyncpg not found, attempting to install..."
    pip install asyncpg
fi

# Run migrations using the Python script
if [ -f "scripts/migrate.py" ]; then
    log_info "Running migrations using scripts/migrate.py"
    export PYTHONPATH="packages/shared:$PYTHONPATH"
    $PYTHON_CMD scripts/migrate.py
else
    log_warn "scripts/migrate.py not found, running SQL directly"
    
    # Alternative: Run migrations directly with psql if available
    if command -v psql &> /dev/null; then
        log_info "Using psql to run migrations"
        
        # Run API migrations (013-019)
        log_info "Running API migrations..."
        for migration in $(ls -1 $API_MIGRATIONS_DIR/*.sql | sort); do
            log_info "Applying: $(basename $migration)"
            psql "$DATABASE_URL" -f "$migration" || {
                log_error "Failed to apply migration: $migration"
                exit 1
            }
        done
    else
        log_error "Neither migrate.py nor psql is available"
        log_error "Cannot run migrations automatically"
        exit 1
    fi
fi

log_info "Migrations completed successfully!"
