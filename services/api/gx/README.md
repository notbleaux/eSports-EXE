# Great Expectations Setup

[Ver001.000]

## Overview

Great Expectations (GE) provides data validation for the player_stats table and other critical data sources.

## Installation

```bash
cd services/api
pip install great-expectations
```

## Quick Start

```bash
# Initialize GE
cd services/api
great_expectations init

# Create expectation suite
great_expectations suite new

# Run validation
great_expectations checkpoint run player_stats_checkpoint
```

## Project Structure

```
services/api/gx/
├── expectations/          # Expectation suites
│   └── player_stats_suite.json
├── checkpoints/           # Validation checkpoints
│   └── player_stats_checkpoint.yml
├── datasources/           # Data source configurations
│   └── postgres_datasource.yml
└── plugins/              # Custom expectations
    └── custom_expectations.py
```

## Expectation Suites

### Player Stats Suite

Validates player statistics data quality:

- `kd_ratio`: Between 0 and 10
- `acs`: Between 0 and 1000
- `matches_played`: Positive integer
- `player_id`: Not null, unique
- `last_updated`: Recent timestamp

## Usage

### Programmatic Validation

```python
from great_expectations import DataContext

context = DataContext("services/api/gx")
results = context.run_checkpoint(checkpoint_name="player_stats_checkpoint")

if not results.success:
    # Handle validation failure
    send_alert(results)
```
