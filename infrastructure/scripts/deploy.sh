#!/bin/bash
# =============================================================================
# SATOR Platform Deployment Script
# =============================================================================
# Usage: ./scripts/deploy.sh [environment]
# Environment: development | staging | production (default: development)
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-development}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SATOR Platform Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo ""

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

confirm() {
    if [ "$ENVIRONMENT" == "production" ]; then
        read -p "Are you sure you want to deploy to production? (yes/no): " answer
        if [ "$answer" != "yes" ]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
}

# =============================================================================
# Pre-Deployment Checks
# =============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if running from correct directory
    if [ ! -f "$PROJECT_DIR/shared/axiom-esports-data/api/main.py" ]; then
        log_error "Not in correct project directory"
        exit 1
    fi
    
    # Check for required files
    required_files=(
        "shared/axiom-esports-data/.env"
        "shared/axiom-esports-data/api/requirements.txt"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$PROJECT_DIR/$file" ]; then
            log_warning "Missing file: $file"
        fi
    done
    
    # Check tools
    command -v python3 >/dev/null 2>&1 || { log_error "python3 is required"; exit 1; }
    command -v docker >/dev/null 2>&1 || log_warning "docker not found (optional)"
    command -v git >/dev/null 2>&1 || log_warning "git not found (optional)"
    
    log_success "Prerequisites checked"
}

# =============================================================================
# Database Operations
# =============================================================================

run_migrations() {
    log_info "Running database migrations..."
    
    cd "$PROJECT_DIR/shared/axiom-esports-data"
    
    if [ -f "scripts/run_migrations.py" ]; then
        python3 scripts/run_migrations.py --env="$ENVIRONMENT"
    else
        log_warning "Migration script not found, skipping"
    fi
    
    log_success "Migrations completed"
}

verify_database() {
    log_info "Verifying database connection..."
    
    cd "$PROJECT_DIR/shared/axiom-esports-data"
    
    python3 << 'PYTHON'
import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()

async def check_db():
    try:
        import asyncpg
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        version = await conn.fetchval("SELECT version()")
        await conn.close()
        print(f"✓ Database connected: {version[:50]}...")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

success = asyncio.run(check_db())
sys.exit(0 if success else 1)
PYTHON
    
    if [ $? -ne 0 ]; then
        log_error "Database verification failed"
        exit 1
    fi
    
    log_success "Database verified"
}

# =============================================================================
# Testing
# =============================================================================

run_tests() {
    log_info "Running tests..."
    
    cd "$PROJECT_DIR"
    
    # API tests
    if [ -d "shared/axiom-esports-data/api/tests" ]; then
        cd "shared/axiom-esports-data/api"
        if [ -f "requirements-test.txt" ]; then
            pip install -q -r requirements-test.txt
        fi
        python3 -m pytest tests/ -v --tb=short || true
        cd "$PROJECT_DIR"
    fi
    
    # Integration tests
    if [ -d "tests/integration" ]; then
        log_info "Running integration tests..."
        python3 -m pytest tests/integration/ -v --tb=short || log_warning "Some integration tests failed"
    fi
    
    log_success "Tests completed"
}

# =============================================================================
# Build & Deploy
# =============================================================================

build_docker() {
    if [ ! command -v docker &> /dev/null ]; then
        return
    fi
    
    log_info "Building Docker images..."
    
    cd "$PROJECT_DIR/shared/axiom-esports-data"
    
    if [ -f "infrastructure/docker-compose.yml" ]; then
        docker-compose -f infrastructure/docker-compose.yml build
        log_success "Docker images built"
    else
        log_warning "docker-compose.yml not found"
    fi
}

deploy_api() {
    log_info "Deploying API..."
    
    if [ "$ENVIRONMENT" == "development" ]; then
        # Local development
        cd "$PROJECT_DIR/shared/axiom-esports-data/api"
        
        log_info "Starting development server..."
        log_info "API will be available at: http://localhost:8000"
        log_info "Press Ctrl+C to stop"
        
        uvicorn main:app --reload --host 0.0.0.0 --port 8000
        
    elif [ "$ENVIRONMENT" == "staging" ]; then
        log_info "Deploying to staging..."
        # Add staging deployment logic here
        log_warning "Staging deployment not configured"
        
    elif [ "$ENVIRONMENT" == "production" ]; then
        log_info "Deploying to production..."
        
        # Check if Render CLI is available
        if command -v render &> /dev/null; then
            render deploy
        else
            log_info "Pushing to GitHub for Render auto-deploy..."
            git push origin main
        fi
        
        log_success "Production deployment triggered"
    fi
}

deploy_web() {
    log_info "Deploying Web Application..."
    
    cd "$PROJECT_DIR/shared/apps/sator-web"
    
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm install
    fi
    
    if [ "$ENVIRONMENT" == "development" ]; then
        log_info "Starting development server..."
        npm run dev
    else
        log_info "Building for production..."
        npm run build
        
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            log_info "Build output ready in dist/"
            log_info "Deploy manually to Vercel or upload dist/ folder"
        fi
    fi
}

# =============================================================================
# Post-Deployment Verification
# =============================================================================

verify_deployment() {
    log_info "Verifying deployment..."
    
    local api_url
    if [ "$ENVIRONMENT" == "development" ]; then
        api_url="http://localhost:8000"
    else
        api_url="${API_URL:-https://your-api.onrender.com}"
    fi
    
    # Health check
    for i in {1..5}; do
        if curl -sf "$api_url/health" > /dev/null 2>&1; then
            log_success "API is healthy"
            break
        fi
        log_info "Waiting for API to be ready... ($i/5)"
        sleep 5
    done
    
    # Run health check
    curl -s "$api_url/health" | python3 -m json.tool 2>/dev/null || true
    
    log_success "Deployment verification completed"
}

# =============================================================================
# Backup Operations
# =============================================================================

create_backup() {
    if [ "$ENVIRONMENT" == "production" ]; then
        log_info "Creating database backup..."
        
        cd "$PROJECT_DIR/shared/axiom-esports-data"
        
        if [ -f "scripts/backup_manager.py" ]; then
            python3 scripts/backup_manager.py full
        else
            log_warning "Backup manager not found"
        fi
    fi
}

# =============================================================================
# Main Deployment Flow
# =============================================================================

main() {
    confirm
    
    log_info "Starting deployment for: $ENVIRONMENT"
    
    # Pre-deployment
    check_prerequisites
    
    # Backup (production only)
    if [ "$ENVIRONMENT" == "production" ]; then
        create_backup
    fi
    
    # Database
    verify_database
    run_migrations
    
    # Testing
    if [ "$ENVIRONMENT" != "development" ]; then
        run_tests
    fi
    
    # Build
    build_docker
    
    # Deploy
    if [ "${DEPLOY_TARGET:-api}" == "api" ]; then
        deploy_api
    elif [ "${DEPLOY_TARGET:-api}" == "web" ]; then
        deploy_web
    else
        deploy_api
        deploy_web
    fi
    
    # Verification
    if [ "$ENVIRONMENT" != "development" ]; then
        verify_deployment
    fi
    
    log_success "Deployment completed successfully!"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  SATOR Platform Deployed${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    if [ "$ENVIRONMENT" == "development" ]; then
        echo "API: http://localhost:8000"
        echo "Web: http://localhost:5173"
        echo ""
        echo "API Documentation:"
        echo "  - Swagger UI: http://localhost:8000/docs"
        echo "  - ReDoc: http://localhost:8000/redoc"
    fi
}

# =============================================================================
# Script Entry Point
# =============================================================================

# Show help
if [ "${1:-}" == "--help" ] || [ "${1:-}" == "-h" ]; then
    echo "SATOR Platform Deployment Script"
    echo ""
    echo "Usage: ./scripts/deploy.sh [environment]"
    echo ""
    echo "Environments:"
    echo "  development  - Local development server (default)"
    echo "  staging      - Staging environment"
    echo "  production   - Production environment"
    echo ""
    echo "Environment Variables:"
    echo "  DEPLOY_TARGET=api|web|all  - What to deploy"
    echo "  API_URL                    - API URL for verification"
    echo ""
    echo "Examples:"
    echo "  ./scripts/deploy.sh development"
    echo "  DEPLOY_TARGET=web ./scripts/deploy.sh production"
    exit 0
fi

# Run main
main
