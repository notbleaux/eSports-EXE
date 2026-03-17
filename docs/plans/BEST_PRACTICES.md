# Best Practices Guide
## Industry Standards + Repo-Specific (ROOT_AXIOMS/ARCH-001)

### Code Reviews
| Type | Process | Tools |
|------|---------|-------|
| **Human** | PR approval, checklist | GitHub PR |
| **Agent** | Pre-commit axioms check | .pre-commit-config.yaml |
| **Script** | Lint/test/CI | GitHub Actions |

### Services as Standards (FastAPI/Godot)
```python
# Standard FastAPI endpoint
@app.get("/v1/players/{id}")
async def get_player(id: str):
    # Defensive: Validate, cache-aside, error boundary
    return await player_service.get_with_cache(id)
```

**Research**: [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/)

### Metric Generation
- Aggregates: Pandas groupby
- EV Formulas: See TRADING_SIM.md

