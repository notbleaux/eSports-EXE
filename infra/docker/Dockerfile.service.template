FROM python:3.11-slim as builder
WORKDIR /build
COPY pyproject.toml poetry.lock ./
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && \
    rm -rf /var/lib/apt/lists/* && \
    pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev --no-directory --no-interaction

FROM python:3.11-slim as runtime
WORKDIR /app
RUN groupadd -r appuser && useradd -r -g appuser appuser
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --chown=appuser:appuser . .
USER appuser
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
    CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=2).raise_for_status()" || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
