#!/bin/bash
# Local Development Setup Script for SATOR Platform
# ==================================================

set -e

echo "🚀 SATOR Platform Local Setup"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found${NC}"
    echo "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker found${NC}"

# Create docker-compose for local dev
cat > docker-compose.local.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: sator-postgres
    environment:
      POSTGRES_USER: sator
      POSTGRES_PASSWORD: sator_dev
      POSTGRES_DB: sator
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./packages/shared/axiom-esports-data/infrastructure/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sator"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: sator-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
EOF

echo "🐳 Starting infrastructure services..."
docker-compose -f docker-compose.local.yml up -d

echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check if services are healthy
until docker exec sator-postgres pg_isready -U sator > /dev/null 2>&1; do
    echo "  Waiting for PostgreSQL..."
    sleep 2
done
echo -e "${GREEN}✅ PostgreSQL ready${NC}"

until docker exec sator-redis redis-cli ping > /dev/null 2>&1; do
    echo "  Waiting for Redis..."
    sleep 2
done
echo -e "${GREEN}✅ Redis ready${NC}"

# Create .env file for API
if [ ! -f "packages/shared/.env" ]; then
    cat > packages/shared/.env << EOF
# Database
DATABASE_URL=postgresql://sator:sator_dev@localhost:5432/sator

# Redis
REDIS_URL=redis://localhost:6379/0

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
APP_NAME=SATOR-API
APP_VERSION=2.1.0
APP_ENVIRONMENT=development
LOG_LEVEL=INFO
LOG_FORMAT=text

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Security
JWT_SECRET=dev-secret-key-change-in-production
EOF
    echo -e "${GREEN}✅ Created packages/shared/.env${NC}"
fi

# Create .env file for web
if [ ! -f "apps/web/.env.local" ]; then
    cat > apps/web/.env.local << EOF
# API Configuration
VITE_API_URL=http://localhost:8000/v1
VITE_WS_URL=ws://localhost:8000/v1/ws

# Sentry (optional - add your DSN for error tracking)
# VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
EOF
    echo -e "${GREEN}✅ Created apps/web/.env.local${NC}"
fi

# Setup Python environment for API
echo ""
echo -e "${BLUE}🐍 Setting up Python environment...${NC}"
cd packages/shared

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "📦 Installing Python dependencies..."
pip install -q -r requirements.txt

echo "🗄️  Running database migrations..."
cd axiom-esports-data
python scripts/run_migrations.py --check
python scripts/run_migrations.py

cd "$PROJECT_ROOT"

# Setup Node.js environment for website
echo ""
echo -e "${BLUE}📦 Setting up Node.js environment...${NC}"

# Install root dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

# Install web dependencies
if [ ! -d "apps/web/node_modules" ]; then
    echo "Installing web dependencies..."
    cd apps/web
    npm install
    cd "$PROJECT_ROOT"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${YELLOW}🚀 To start the development environment:${NC}"
echo ""
echo "1. Start the API server:"
echo -e "   ${BLUE}cd packages/shared${NC}"
echo -e "   ${BLUE}source venv/bin/activate${NC}"
echo -e "   ${BLUE}cd axiom-esports-data/api${NC}"
echo -e "   ${BLUE}uvicorn main:app --reload --host 0.0.0.0 --port 8000${NC}"
echo ""
echo "2. Start the web frontend (in a new terminal):"
echo -e "   ${BLUE}cd apps/web${NC}"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "Services will be available at:"
echo -e "  ${GREEN}API:${NC}      http://localhost:8000"
echo -e "  ${GREEN}Docs:${NC}     http://localhost:8000/docs (Swagger UI)"
echo -e "  ${GREEN}Health:${NC}   http://localhost:8000/health"
echo -e "  ${GREEN}Web:${NC}      http://localhost:5173"
echo ""
echo -e "${YELLOW}🐳 To stop infrastructure services:${NC}"
echo -e "   ${BLUE}docker-compose -f docker-compose.local.yml down${NC}"
echo ""
