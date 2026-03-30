# NJZ Platform Blueprint
## Repository: njzitegeist-platform

### Scope
Web application and API backend only.

### Structure
```
njz-platform/
├── apps/
│   └── web/                 # React 18 + Vite
├── packages/
│   ├── api/                 # FastAPI
│   └── types/               # Shared TypeScript schemas
├── infrastructure/
│   ├── k8s/                 # Kubernetes manifests
│   └── terraform/           # AWS/GCP resources
└── docker-compose.yml       # Local development
```

### Dependencies
- rotas-simulation (npm package)
- axiom-pipeline (API consumer)
