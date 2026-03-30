#!/bin/bash
# Post-start script for dev container
# Runs every time the container starts

set -e

echo "🔍 Checking service health..."

# Check if services are healthy
if ! curl -sf http://localhost:8000/health > /dev/null 2>&1; then
    echo "⚠️ API is not running. Start it with: docker-compose up -d api"
fi

echo "✅ Dev container ready!"
