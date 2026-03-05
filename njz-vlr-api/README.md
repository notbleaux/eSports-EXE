# NJZ VLR API - Production-Grade Valorant Esports API

A high-performance, production-ready API for Valorant esports data from VLR.gg with RAWS/BASE twin-file integrity, circuit breaker patterns, and comprehensive monitoring.

## 🚀 Key Features

### Core Architecture
- **RAWS/BASE Twin-File System** - Immutable raw storage with SHA-256 integrity verification
- **Circuit Breaker Pattern** - Prevents cascade failures when VLR.gg is unavailable
- **Multi-Tier Caching** - L1 (Memory) → L2 (Redis) → L3 (Disk)
- **Auto-Discovery DOM Parser** - ML-based anomaly detection for HTML structure changes
- **Webhook Subscriptions** - Real-time notifications for new matches/events

### Advanced Capabilities
- **API Tier System** - Free/Pro/Enterprise with rate limiting
- **Backup Data Sources** - Fallback to alternative sources
- **Time-Series Database** - InfluxDB for historical analytics
- **Data Export Pipeline** - CSV/Parquet export for analytics workflows
- **Comprehensive Testing** - pytest with VCR.py for HTTP mocking

## 📁 Project Structure

```
njz-vlr-api/
├── src/
│   ├── api/              # FastAPI routes and middleware
│   ├── core/             # Configuration, logging, exceptions
│   ├── scrapers/         # Scrapers with circuit breaker
│   ├── data/             # Models and storage (RAWS/BASE)
│   ├── services/         # Webhooks, exports, integrity
│   └── utils/            # HTTP client, checksums, DOM detector
├── tests/                # pytest suite with VCR.py
├── data/                 # Local data storage (RAWS/BASE)
├── config/               # Configuration files
├── docs/                 # Documentation
├── main.py              # Application entry point
├── Dockerfile           # Container build
└── docker-compose.yml   # Full stack deployment
```

## 🛠️ Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/njz/vlr-api.git
cd vlr-api

# Start all services
docker-compose up -d

# API available at http://localhost:3001
# Grafana dashboard at http://localhost:3000
```

### Manual Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run application
python main.py
```

## 📡 API Endpoints

### V2 API (Recommended)

```http
GET /v2/matches/upcoming       # Upcoming matches (5min cache)
GET /v2/matches/live           # Live scores (30s cache)
GET /v2/matches/results        # Completed matches (1hr cache)
GET /v2/matches/details/{id}   # Match details with player stats

GET /v2/rankings?region=na     # Team rankings by region
GET /v2/stats?region=na&timespan=30  # Player statistics

GET /v2/players?id={id}        # Player profile
GET /v2/teams?id={id}          # Team profile
GET /v2/events                 # Tournaments and events

GET /health                    # Health check
```

### Response Format

All V2 endpoints return standardized responses:

```json
{
  "status": "success",
  "data": { ... },
  "cached": false,
  "rate_limit": {
    "tier": "free",
    "remaining": 499,
    "reset": "2024-03-05T12:00:00Z"
  }
}
```

## 🔒 Security Features

### XSS Protection
- DOMPurify integration with whitelist approach
- Dangerous protocol blocking (javascript:, data:, etc.)
- URL decoding protection against encoded attacks

### Rate Limiting
| Tier | Per Minute | Per Hour | Per Day |
|------|-----------|----------|---------|
| Free | 30 | 500 | 2,000 |
| Pro | 120 | 3,000 | 15,000 |
| Enterprise | 600 | 15,000 | 100,000 |

### Webhook Security
- HMAC-SHA256 signature verification
- Automatic retry with exponential backoff
- Deactivation after 5 consecutive failures

## 📊 Data Integrity (RAWS/BASE)

### RAWS (Raw Archive Web Scrape)
- Immutable storage of original HTML
- SHA-256 checksums for verification
- Versioned with timestamps
- Compressed storage with Git LFS support

### BASE (Business Analytics Structured Export)
- Processed, validated data
- Database storage (PostgreSQL/SQLite)
- Analytics-ready format
- Reconstructed from RAWS if needed

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test categories
pytest -m unit
pytest -m integration
pytest -m performance
```

## 📈 Monitoring

### Prometheus Metrics
- Request count and latency
- Scraper success/failure rates
- Cache hit/miss ratios
- Circuit breaker state

### Grafana Dashboards
- API performance
- Data freshness
- Error rates
- Rate limit usage

## 🚀 Deployment

### Production Checklist
- [ ] Set `DEBUG=false`
- [ ] Configure Redis for caching
- [ ] Set up InfluxDB for metrics
- [ ] Configure API keys for tiers
- [ ] Enable webhook secret validation
- [ ] Set up log aggregation
- [ ] Configure backup sources

### Environment Variables

```bash
# Required
DEBUG=false
DATA_STORAGE_PATH=/app/data

# Optional - Redis Cache
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379/0

# Optional - Time-Series DB
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-token
INFLUXDB_ORG=njz
INFLUXDB_BUCKET=vlr_data

# Optional - API Security
API_KEY_REQUIRED=true
ALLOWED_API_KEYS=key1,key2,key3

# Optional - Webhooks
WEBHOOK_SECRET=your-secret
```

## 📝 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📧 Support

- Documentation: `/docs` endpoint
- Issues: GitHub Issues
- Contact: api@njz.gg