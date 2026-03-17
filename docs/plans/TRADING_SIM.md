# Trading Simulation (Paper Stocks → VCT Betting)

## EV Refiner for Reserve Bank
```python
# data/trading_ev.py
def vct_ev(team_form: float, odds: float, bank_reserve: float) -> float:
    prob = logistic_regression(team_form)
    ev = prob * (odds - 1) - (1 - prob)
    adjusted_ev = ev * (1 + bank_reserve / 1e6)  # Token influence
    return adjusted_ev

# Backtest: Paper stocks refit for VCT matches
backtest_results = simulate_bets(historical_vct, strategy=&#39;ev_positive&#39;)
```

**Integration**: Reserve Bank API mock → EV adjustment → Betting odds.
**Research**: [QuantConnect Paper Trading](https://www.quantconnect.com/), VCT odds APIs.

