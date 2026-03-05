#!/bin/bash
# DEPLOYMENT SCRIPT - NJZ VLR API
# Usage: ./deploy.sh [dev|prod]

set -e

ENV=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 NJZ VLR API Deployment"
echo "=========================="
echo "Environment: $ENV"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✅ Python: $PYTHON_VERSION"

# Create data directories
echo ""
echo "📁 Creating directories..."
mkdir -p data/{raws,base,cache,exports}
mkdir -p logs
touch data/.gitkeep

# Setup environment
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env not found, creating from template..."
    cat > .env << 'EOF'
DEBUG=false
HOST=0.0.0.0
PORT=3001
EOF
    echo "✅ Created .env with defaults"
fi

# Install dependencies
if [ ! -d "venv" ]; then
    echo ""
    echo "🔧 Creating virtual environment..."
    python3 -m venv venv
fi

echo ""
echo "📦 Installing dependencies..."
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo "✅ Dependencies installed"

# Run based on environment
if [ "$ENV" == "dev" ]; then
    echo ""
    echo "🚀 Starting DEVELOPMENT server..."
    echo "   API: http://localhost:3001"
    echo "   Docs: http://localhost:3001/docs"
    echo "   Press Ctrl+C to stop"
    echo ""
    python main.py
    
elif [ "$ENV" == "prod" ]; then
    echo ""
    echo "🚀 Starting PRODUCTION server..."
    echo "   API: http://localhost:3001"
    echo ""
    
    # Use uvicorn directly for production
    exec venv/bin/uvicorn main:app \
        --host 0.0.0.0 \
        --port 3001 \
        --workers 2 \
        --log-level info
else
    echo "❌ Unknown environment: $ENV"
    echo "Usage: ./deploy.sh [dev|prod]"
    exit 1
fi