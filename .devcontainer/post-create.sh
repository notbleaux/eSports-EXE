#!/bin/bash
# Post-create setup script for dev container
# [Part: 1/1, Phase: 1/1, Progress: 100%, Status: Complete]

set -e

echo "🚀 Setting up NJZiteGeisTe development environment..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
cd /app/packages/shared
pip install -r requirements.txt

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd /app
pnpm install

# Create .env.local if it doesn't exist
if [ ! -f /app/.env.local ]; then
    echo "📝 Creating .env.local..."
    cat > /app/.env.local << EOF
# Development Environment Configuration
DATABASE_URL=postgresql://postgres:postgres@db:5432/njz_platform
REDIS_URL=redis://redis:6379
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=njz-storage
JWT_SECRET_KEY=dev-secret-key-change-in-production
TOTP_ENCRYPTION_KEY=dev-totp-key-change-in-production
APP_ENVIRONMENT=development
DEBUG=true
PANDASCORE_API_KEY=
EOF
fi

# Wait for database to be ready
echo "⏳ Waiting for database..."
until pg_isready -h db -p 5432 -U postgres; do
    sleep 1
done

# Run migrations
echo "🗄️ Running database migrations..."
cd /app/packages/shared
python -c "
import asyncio
from api.src.database import engine
from api.src.models import Base

async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(init())
"

echo "✅ Development environment setup complete!"
echo ""
echo "Available services:"
echo "  - Web: http://localhost:5173"
echo "  - API: http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - pgAdmin: http://localhost:5050"
echo "  - Redis Commander: http://localhost:8081"
echo "  - MailHog: http://localhost:8025"
echo "  - MinIO Console: http://localhost:9001"
