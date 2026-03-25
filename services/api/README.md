# NJZiteGeisTe API Service

FastAPI backend for the NJZiteGeisTe platform.

## Status
Phase 4 migration in progress. Source code being consolidated from `packages/shared/api/`.

## Structure
```
services/api/
├── main.py              Entry point (uvicorn main:app)
├── pyproject.toml       Poetry dependency management
├── requirements.txt     Legacy pip reference
└── src/
    └── njz_api/         Main package
        ├── routers/     API route handlers
        ├── models/      SQLAlchemy models
        ├── schemas/     Pydantic schemas
        ├── services/    Business logic
        └── core/        Config, auth, database
```

## Running locally
```bash
cd services/api
poetry install
poetry run uvicorn main:app --reload --port 8000
```

## Original location
`packages/shared/api/` — do not delete until Phase 4 is complete.
