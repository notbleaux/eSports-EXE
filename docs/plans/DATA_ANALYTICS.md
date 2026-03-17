# Data Analytics & Aggregates

## Statistical Analysis Pipeline
```python
# packages/shared/axiom-esports-data/
import pandas as pd
df = pd.read_sql("SELECT * FROM reconstructed_records", conn)
aggregates = df.groupby(&#39;team_id&#39;).agg({
  &#39;kills&#39;: [&#39;mean&#39;, &#39;std&#39;],
  &#39;ev&#39;: &#39;sum&#39;
})
```

**Metrics**: SimRating, RAR, custom EV from trading sim.
**Twin-Table**: raw_extractions → reconstructed.

