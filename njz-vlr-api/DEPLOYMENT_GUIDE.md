# NJZ VLR API - DEPLOYMENT GUIDE

## 🚀 Quick Deploy (Recommended)

```bash
# 1. Navigate to project
cd /root/.openclaw/workspace/njz-vlr-api

# 2. Run system check
./check-system.sh

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings (see below)

# 4. Deploy
./deploy.sh production
```

---

## ⚙️ Pre-Deployment Configuration

### 1. Environment Variables (REQUIRED)

Edit `.env` file:

```bash
# Critical: Change these for production
DEBUG=false
WEBHOOK_SECRET=your-random-secret-here-min-32-chars
ALLOWED_API_KEYS=your-api-key-1,your-api-key-2

# Optional: Enable for better performance
REDIS_ENABLED=true
INFLUXDB_URL=http://localhost:8086
```

### 2. API Key Generation

Generate secure API keys:

```bash
# Generate random API key
openssl rand -hex 32

# Add to .env
ALLOWED_API_KEYS=key1,key2,key3
```

### 3. Webhook Secret

```bash
# Generate webhook signing secret
openssl rand -hex 64

# Add to .env
WEBHOOK_SECRET=your-generated-secret
```

---

## 🐳 Docker Deployment

### Production (Full Stack)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all
docker-compose down
```

### Services Included

| Service | Port | Purpose |
|---------|------|---------|
| API | 3001 | Main API server |
| Redis | 6379 | L2 Cache |
| InfluxDB | 8086 | Time-series DB |
| Prometheus | 9090 | Metrics |
| Grafana | 3000 | Dashboards |

### Resource Requirements

Minimum:
- 2 CPU cores
- 4GB RAM
- 10GB disk

Recommended:
- 4 CPU cores
- 8GB RAM
- 50GB disk

---

## 🔧 Manual Deployment (No Docker)

### Prerequisites

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip redis-server

# macOS
brew install python@3.11 redis

# Start Redis
sudo systemctl start redis  # Linux
brew services start redis    # macOS
```

### Installation

```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run
python main.py
```

---

## 🔒 Security Checklist

Before production:

- [ ] Changed default secrets in `.env`
- [ ] Set `DEBUG=false`
- [ ] Enabled `API_KEY_REQUIRED=true`
- [ ] Generated strong `WEBHOOK_SECRET`
- [ ] Configured firewall (ports 3001, 3000, 9090)
- [ ] Set up HTTPS/TLS termination
- [ ] Configured log rotation
- [ ] Disabled unused services

---

## 🧪 Testing Deployment

```bash
# Health check
curl http://localhost:3001/health

# Test endpoint
curl http://localhost:3001/v2/matches/upcoming

# Check metrics
curl http://localhost:3001/metrics
```

---

## 📊 Monitoring

### Grafana Dashboard

- URL: http://localhost:3000
- Default login: admin/admin
- Change password on first login

### Prometheus Metrics

- URL: http://localhost:9090
- Query examples:
  - `rate(api_requests_total[5m])`
  - `scraper_success_rate`
  - `cache_hit_ratio`

### Log Aggregation

Logs are stored in:
- Docker: `docker-compose logs`
- Manual: `./logs/` directory

---

## 🔄 Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Check health
curl http://localhost:3001/health
```

---

## 🆘 Troubleshooting

### API won't start

```bash
# Check logs
docker-compose logs api

# Verify .env exists
ls -la .env

# Check port conflicts
lsof -i :3001
```

### Scraper failures

```bash
# Check circuit breaker status
curl http://localhost:3001/health

# Review scraper logs
docker-compose logs api | grep scraper

# Test VLR.gg connectivity
curl -I https://www.vlr.gg
```

### High memory usage

```bash
# Monitor containers
docker stats

# Restart services
docker-compose restart

# Clear cache
redis-cli FLUSHDB
```

---

## 📞 Support

- Documentation: `/docs` endpoint
- Health: `/health` endpoint
- Issues: Check logs first