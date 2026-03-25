# API Clients

External data source clients for NJZiteGeisTe.

| Client | Source | Games | Status |
|--------|--------|-------|--------|
| `pandascore.py` | PandaScore API | Valorant, CS2 | Ready |

## Usage

```python
from njz_api.clients import pandascore

# In an async FastAPI route handler:
matches = await pandascore.get_valorant_matches(status="upcoming")
teams = await pandascore.get_cs2_teams()
```

## Environment variables required
- `PANDASCORE_API_KEY` — obtain from https://developers.pandascore.co
