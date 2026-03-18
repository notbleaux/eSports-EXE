# Reserve Bank & Token Currencies

## Interaction with Trading Sim
```python
# Complementary: EV refiner
def adjust_ev(ev_base: float, token_reserve: float) -> float:
    multiplier = 1 + (token_reserve / total_supply) * 0.1
    return ev_base * multiplier

# API Mock for prototypes
@app.post("/v1/reserve/balance")
async def get_reserve(): return {"reserve": 1e6, "token_price": 0.42}
```

**Refinement**: Paper trading feedback loop → Bank policy sim.
**Dependencies**: Supabase (token ledger), Redis (rates).

