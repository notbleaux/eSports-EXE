# ADR-002: React + FastAPI Tech Stack

**Status:** Accepted  
**Date:** 2026-03-31  
**Deciders:** Elijah Bleaux, Kimi  
**Technical Story:** Technology selection for v1.0

---

## Context and Problem Statement

eSports-EXE requires a modern, scalable tech stack that supports:
- Real-time data visualization
- Complex statistical calculations
- Machine learning integration
- Cross-platform compatibility (web first, mobile later)

## Decision Drivers

- Type safety for complex data structures
- Performance for real-time updates
- Ecosystem maturity and community support
- Developer experience and productivity
- Deployment flexibility

## Considered Options

### Option 1: Next.js Full-Stack
Next.js with API routes, server components.

### Option 2: React Frontend + Node.js Backend
Traditional SPA with Express/Fastify backend.

### Option 3: React + FastAPI
Modern SPA with Python FastAPI backend.

## Decision Outcome

Chosen option: **React + FastAPI**

**Frontend:**
- React 18+ with TypeScript
- TailwindCSS for styling
- Framer Motion for animations
- TanStack Query for data fetching

**Backend:**
- Python 3.11+
- FastAPI for API layer
- PostgreSQL for primary data
- Redis for caching
- Celery for background tasks

### Positive Consequences

- Python ecosystem excellent for ML/data science
- FastAPI provides automatic API documentation
- TypeScript ensures frontend type safety
- Clear separation enables independent scaling
- Large talent pool for both technologies

### Negative Consequences

- Two languages to maintain (TypeScript + Python)
- Context switching between frontend/backend
- More complex deployment initially

## Pros and Cons of the Options

### Next.js Full-Stack
- Good: Single framework, unified deployment
- Good: Server components for performance
- Bad: Python ML libraries harder to integrate
- Bad: Vercel lock-in for optimal performance

### React + Node.js
- Good: Single language (JavaScript/TypeScript)
- Good: Large npm ecosystem
- Bad: Python ML requires separate service anyway
- Bad: Less mature for data science workflows

### React + FastAPI
- Good: Best of both ecosystems
- Good: Python's strength in ML/data
- Good: FastAPI's automatic OpenAPI docs
- Good: Independent scaling of services
- Bad: Two language environments
- Bad: Slightly more complex setup

## Links

- [Master Plan](../master-plan/master-plan.md#31-frontend-boundaries)
- [Backend Architecture](../master-plan/master-plan.md#32-backend-boundaries)

## Notes

The existing codebase already uses this stack. This ADR documents and ratifies the decision.
