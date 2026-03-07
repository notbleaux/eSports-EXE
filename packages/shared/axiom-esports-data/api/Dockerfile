# =============================================================================
# SATOR API - Production Docker Image
# Multi-stage build for optimized size and security
# =============================================================================

# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY shared/axiom-esports-data/api/requirements.txt .

# Install Python packages to user directory
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim as runtime

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts are in PATH
ENV PATH=/root/.local/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1

# Copy application code
COPY shared/axiom-esports-data/api/main.py .
COPY shared/axiom-esports-data/api/src/ ./src/
COPY shared/axiom-esports-data/api/scripts/ ./scripts/

# Copy shared modules
COPY shared/axiom-esports-data/analytics/ ./analytics/
COPY shared/axiom-esports-data/extraction/ ./extraction/
COPY shared/axiom-esports-data/pipeline/ ./pipeline/

# Create non-root user for security
RUN groupadd -r sator && useradd -r -g sator -u 1000 sator \
    && chown -R sator:sator /app \
    && mkdir -p /app/logs \
    && chown sator:sator /app/logs

# Switch to non-root user
USER sator

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--proxy-headers"]
