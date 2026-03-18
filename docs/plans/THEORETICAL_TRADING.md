# Theoretical Paper Trading (NJZ Directory)

## Framework Evaluation & Metrics Advisor
- Assess ideas/predictiveness for NJZ central.
- EVP (Expected Value Prob), EVR (Expected Value Range).
- Offline Sim: eSports probs (SATOR/ROTAS refs, certainty/uncertainty).

```python
# data/theoretical_ev.py
def theoretical_evp(framework_stats: dict) -> tuple[float, float]:
    evp = logistic(framework.form)  # Point estimate
    evr_low, evr_high = monte_carlo_sim(framework, n=10000)  # Uncertainty
    return evp, (evr_low, evr_high)
```

**FM-like GM**: Scout/Analyst→Coach→Director→Owner (harder toggles). Open League/Wild Narrative (13-slot roulette).
**Podcasts**: PlatChat (Valorant), PFF-eS (CS2) duos/panels, emergent stories (2020-25 forum meta).

