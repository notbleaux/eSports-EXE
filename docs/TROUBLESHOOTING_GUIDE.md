[Ver001.000]

# Troubleshooting Guide — 4NJZ4 TENET Platform

**Version:** 2.1.0  
**Last Updated:** 2026-03-15

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [API Issues](#api-issues)
4. [Web Issues](#web-issues)
5. [Database Issues](#database-issues)
6. [WebSocket Issues](#websocket-issues)
7. [Performance Issues](#performance-issues)
8. [Debug Mode](#debug-mode)

---

## Quick Diagnostics

### System Status Check

```bash
#!/bin/bash
# scripts/diagnostics.sh

echo "=== 4NJZ4 Platform Diagnostics ==="

# API Health
echo "Checking API..."
curl -s https://api.libre-x-esport.com/health | jq .

# Web Health
echo -e "\nChecking Web..."
curl -s -o /dev/null -w "Status: %{http_code}\n" https://libre-x-esport.com

# Database
echo -e "\nChecking Database..."
psql $DATABASE_URL -c "SELECT COUNT(*) FROM players;"

# Redis
echo -e "\nChecking Redis..."
redis-cli -u $REDIS_URL ping

echo -e "\n=== Diagnostics Complete ==="
```

### Environment Verification

```bash
# Check environment variables
echo "API URL: $VITE_API_URL"
echo "Database URL: ${DATABASE_URL:0:20}..."
echo "Redis URL: ${REDIS_URL:0:20}..."

# Check versions
node --version
python --version
godot --version
```

---

## Common Issues

### Issue: "Cannot connect to API"

**Symptoms:**
- Web app shows "Connection error"
- API calls failing in browser

**Diagnosis:**
```bash
# 1. Check if API is running
curl https://api.libre-x-esport.com/health

# 2. Check CORS configuration
curl -I -H "Origin: https://libre-x-esport.com" \
  https://api.libre-x-esport.com/health

# 3. Check in browser console for CORS errors
```

**Solutions:**

1. **API is down:**
   - Check Render dashboard
   - Review recent deployments
   - Check logs: `render logs --service libre-x-esport-api`

2. **CORS error:**
   ```python
   # Update CORS origins
   CORS_ORIGINS = [
       "https://libre-x-esport.com",
       "http://localhost:5173",  # For local dev
   ]
   ```

3. **Wrong API URL:**
   ```bash
   # Should include /v1
   VITE_API_URL=https://api.libre-x-esport.com/v1
   ```

---

### Issue: "Search not working"

**Symptoms:**
- Search returns no results
- Autocomplete not showing
- 500 errors on search endpoint

**Diagnosis:**
```bash
# Test search endpoint
curl "https://api.libre-x-esport.com/v1/search/?q=TenZ"

# Check rate limiting
curl -I "https://api.libre-x-esport.com/v1/search/?q=test"
# Look for X-RateLimit-Remaining header

# Check database
curl "https://api.libre-x-esport.com/v1/players/?limit=1"
```

**Solutions:**

1. **No search results:**
   - Verify data exists: Check if players table has data
   - Check search indexes: `SELECT * FROM pg_indexes WHERE tablename LIKE '%player%';`

2. **Rate limited:**
   - Wait 1 minute (30 req/min limit)
   - Check client implementation for request batching

3. **Database issue:**
   - Run: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM players;"`
   - If 0, run data pipeline

---

## API Issues

### Slow Response Times

**Diagnosis:**
```bash
# Test with timing
curl -w "@curl-format.txt" -o /dev/null -s \
  https://api.libre-x-esport.com/v1/players/?limit=50

# curl-format.txt:
# time_namelookup: %{time_namelookup}\n
# time_connect: %{time_connect}\n
# time_appconnect: %{time_appconnect}\n
# time_pretransfer: %{time_pretransfer}\n
# time_redirect: %{time_redirect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total: %{time_total}\n
```

**Solutions:**

1. **Cold start (Render):**
   - Set up keepalive: See [Deployment Guide](DEPLOYMENT_GUIDE.md)
   - Consider paid tier for always-on

2. **Slow database queries:**
   ```sql
   -- Find slow queries
   SELECT query, mean_exec_time 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

3. **Missing indexes:**
   ```sql
   -- Add index for common queries
   CREATE INDEX CONCURRENTLY idx_players_region ON players(region);
   CREATE INDEX CONCURRENTLY idx_players_sim_rating ON players(sim_rating DESC);
   ```

### 500 Internal Server Error

**Diagnosis:**
```bash
# Check logs
render logs --service libre-x-esport-api --tail 100

# Look for:
# - Python tracebacks
# - Database connection errors
# - Memory errors
```

**Common Causes:**

1. **Database connection pool exhausted:**
   ```python
   # Increase pool size (careful with free tier)
   max_connections = 10  # default: 5
   ```

2. **Memory limit (Render free tier):**
   - Reduce cache TTL
   - Optimize large queries
   - Add pagination

3. **Import errors:**
   ```bash
   # Check for missing dependencies
   pip install -r requirements.txt
   python -c "import main"
   ```

---

## Web Issues

### Build Failures

```bash
cd apps/website-v2

# Check TypeScript errors
npm run typecheck

# Check lint errors
npm run lint

# Try building
npm run build
```

**Common Issues:**

1. **Type errors:**
   ```typescript
   // Check for missing types
   npm install -D @types/missing-package
   ```

2. **Import errors:**
   ```typescript
   // Ensure correct imports
   import { useWebSocket } from '@/hooks/useWebSocket';
   // NOT: import { useWebSocket } from '../hooks/useWebSocket';
   ```

3. **Environment variables:**
   ```bash
   # Check .env.local exists
   ls -la .env.local
   
   # Verify variables
   cat .env.local | grep VITE_API_URL
   ```

### Runtime Errors

**White Screen:**
- Check browser console for errors
- Verify API is accessible
- Check for JavaScript errors in Sentry (if configured)

**Error Boundaries Triggered:**
```typescript
// Add error logging
componentDidCatch(error, errorInfo) {
  console.error('Error:', error);
  console.error('Info:', errorInfo);
  // Send to analytics
}
```

### Performance Issues

**Slow Page Load:**

1. **Check bundle size:**
   ```bash
   npm run build
   ls -lh dist/assets/*.js
   ```

2. **Analyze bundle:**
   ```bash
   npm install -D rollup-plugin-visualizer
   # Add to vite.config.ts, then:
   npm run build
   open dist/stats.html
   ```

3. **Code splitting:**
   ```typescript
   // Lazy load heavy components
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

---

## Database Issues

### Connection Failures

**Error:** `connection refused` or `timeout`

**Solutions:**

1. **Check connection string:**
   ```bash
   # Should use connection pooler for serverless
   postgresql://...:6543/postgres?sslmode=require
   ```

2. **Verify Supabase status:**
   - https://status.supabase.com

3. **Test connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

### Slow Queries

**Find slow queries:**
```sql
-- Enable query statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT 
    query,
    calls,
    mean_exec_time,
    total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Optimize:**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_players_search 
ON players USING gin(search_vector);

-- Analyze table
ANALYZE players;
```

### Data Integrity Issues

**Check data consistency:**
```sql
-- Verify player counts
SELECT region, COUNT(*) FROM players GROUP BY region;

-- Check for orphaned records
SELECT * FROM player_performance 
WHERE player_id NOT IN (SELECT id FROM players);

-- Verify twin-file integrity
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE raw = 1) as raw_count,
    COUNT(*) FILTER (WHERE raw = 0) as reconstructed_count
FROM player_performance;
```

---

## WebSocket Issues

### Connection Failures

**Symptoms:**
- Real-time updates not working
- WebSocket shows "disconnected"

**Diagnosis:**
```javascript
// Add logging to WebSocket
const ws = new WebSocket('wss://api.libre-x-esport.com/v1/ws');

ws.onopen = () => console.log('Connected');
ws.onclose = (e) => console.log('Closed:', e.code, e.reason);
ws.onerror = (e) => console.error('Error:', e);
```

**Solutions:**

1. **Check WebSocket URL:**
   ```typescript
   // Should use wss:// for production
   const WS_URL = 'wss://api.libre-x-esport.com/v1/ws';
   ```

2. **Verify authentication:**
   ```javascript
   // Include token in connection URL
   const ws = new WebSocket(`wss://.../v1/ws?token=${token}`);
   ```

3. **Check rate limiting:**
   - WebSocket has 100 messages/minute limit
   - Implement message batching if needed

### Reconnection Loop

**Fix:**
```typescript
// Implement proper backoff
const useWebSocket = (options) => {
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  useEffect(() => {
    const backoff = Math.min(1000 * 2 ** reconnectAttempt, 30000);
    const timer = setTimeout(connect, backoff);
    return () => clearTimeout(timer);
  }, [reconnectAttempt]);
};
```

---

## Performance Issues

### High CPU Usage

**Diagnosis:**
```bash
# Check process CPU
htop

# Python profiling
python -m cProfile -o profile.stats main.py
```

**Solutions:**

1. **Optimize hot paths:**
   ```python
   # Cache expensive calculations
   @cached(ttl=300)
   async def get_leaderboard():
       # ... expensive query
   ```

2. **Add pagination:**
   ```python
   # Limit large result sets
   query = query.limit(100).offset(offset)
   ```

### Memory Issues

**Render free tier (512MB):**

1. **Reduce cache size:**
   ```python
   # Limit Redis memory
   maxmemory-policy allkeys-lru
   ```

2. **Stream large responses:**
   ```python
   from fastapi.responses import StreamingResponse
   
   async def stream_data():
       for chunk in large_dataset:
           yield chunk
   
   return StreamingResponse(stream_data())
   ```

---

## Debug Mode

### Enable Debug Logging

**Python:**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend:**
```typescript
// Add to main.tsx
if (import.meta.env.DEV) {
  localStorage.setItem('debug', '*');
}
```

### Local Database Testing

```bash
# Start local PostgreSQL
docker run -d \
  --name sator-db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15

# Run migrations
psql postgresql://postgres:postgres@localhost:5432/postgres \
  -f infrastructure/migrations/*.sql

# Start Redis
docker run -d --name sator-redis -p 6379:6379 redis:7
```

### API Debug Endpoints

```python
@app.get("/debug/config")
async def debug_config():
    """Get runtime configuration (dev only)."""
    return {
        "environment": os.getenv("APP_ENVIRONMENT"),
        "database_url": os.getenv("DATABASE_URL", "")[:20] + "...",
        "redis_url": os.getenv("REDIS_URL", "")[:20] + "...",
    }

@app.get("/debug/cache")
async def debug_cache():
    """Get cache statistics."""
    return await redis.info()
```

---

## Getting Help

### Resources

1. **Documentation:**
   - [API Documentation](API_V1_DOCUMENTATION.md)
   - [Architecture](ARCHITECTURE_V2.md)
   - [Deployment Guide](DEPLOYMENT_GUIDE.md)

2. **Logs:**
   - Render: `render logs --service libre-x-esport-api`
   - Vercel: Dashboard → Deployments → Functions

3. **Support:**
   - Issues: https://github.com/notbleaux/eSports-EXE/issues
   - Discussions: https://github.com/notbleaux/eSports-EXE/discussions

### Diagnostic Script

```bash
#!/bin/bash
# Save as: scripts/full-diagnostics.sh

echo "=== Full System Diagnostics ==="
echo "Date: $(date)"
echo ""

echo "1. Environment"
echo "  Node: $(node --version)"
echo "  Python: $(python --version)"
echo ""

echo "2. API Health"
curl -s https://api.libre-x-esport.com/health | jq .
echo ""

echo "3. Web Status"
curl -s -o /dev/null -w "  Status: %{http_code}\n" https://libre-x-esport.com
echo ""

echo "4. Database"
psql $DATABASE_URL -c "SELECT COUNT(*) as players FROM players;" 2>/dev/null || echo "  Database connection failed"
echo ""

echo "5. Redis"
redis-cli -u $REDIS_URL ping 2>/dev/null || echo "  Redis connection failed"
echo ""

echo "6. File System"
df -h | grep -E '(Filesystem|/)'
echo ""

echo "=== Diagnostics Complete ==="
```

---

*End of Troubleshooting Guide*
