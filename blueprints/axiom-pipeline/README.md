# Axiom Data Pipeline Blueprint
## Repository: axiom-data-pipeline

### Scope
ETL pipeline, CDC ingestion, feature computation.

### Structure
```
axiom-pipeline/
├── src/
│   ├── ingestion/          # Pandascore API, webhooks
│   ├── transform/          # ETL jobs
│   ├── features/           # Feature store
│   └── streaming/          # Kafka consumers
├── jobs/
│   ├── dbt/               # Data transformations
│   └── airflow/           # Orchestration
├── infrastructure/
│   └── terraform/         # AWS EMR, Kinesis
└── docker-compose.yml     # Local development
```

### Services
- Data ingestion (Pandascore API)
- CDC (Debezium + Kafka Connect)
- Feature store (online/offline)
- Great Expectations validation
