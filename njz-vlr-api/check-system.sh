#!/bin/bash
# Pre-deployment system check script

echo "🔍 NJZ VLR API - Pre-Deployment Check"
echo "======================================"
echo ""

# Check Python version
echo "Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "  Python: $PYTHON_VERSION"

if python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)"; then
    echo "  ✅ Python 3.9+ required - PASS"
else
    echo "  ❌ Python 3.9+ required - FAIL"
    exit 1
fi

# Check available ports
echo ""
echo "Checking port availability..."
for port in 3001 6379 8086 9090 3000; do
    if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "  ✅ Port $port available"
    else
        echo "  ⚠️  Port $port in use"
    fi
done

# Check disk space
echo ""
echo "Checking disk space..."
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo "  ✅ Disk usage: ${DISK_USAGE}% - PASS"
else
    echo "  ⚠️  Disk usage: ${DISK_USAGE}% - WARNING"
fi

# Check memory
echo ""
echo "Checking memory..."
if command -v free &> /dev/null; then
    MEMORY_MB=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$MEMORY_MB" -gt 2048 ]; then
        echo "  ✅ Memory: ${MEMORY_MB}MB - PASS"
    else
        echo "  ⚠️  Memory: ${MEMORY_MB}MB - Low (recommend 4GB+)"
    fi
fi

# Check Docker
echo ""
echo "Checking Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "  ✅ Docker installed: $DOCKER_VERSION"
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        echo "  ✅ Docker Compose: $COMPOSE_VERSION"
    else
        echo "  ⚠️  Docker Compose not found (optional)"
    fi
else
    echo "  ⚠️  Docker not found (optional for manual deploy)"
fi

echo ""
echo "======================================"
echo "✅ Pre-deployment check complete"
echo ""
echo "Next steps:"
echo "  1. cp .env.example .env"
echo "  2. Edit .env with your settings"
echo "  3. Run: docker-compose up -d"
echo "     OR:  ./deploy.sh"