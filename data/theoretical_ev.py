#!/usr/bin/env python3
"""Theoretical EV Prototype"""
import numpy as np
from scipy.stats import logistic


def theoretical_evp(
    form: float, n_sims: int = 10000
) -> tuple[float, tuple[float, float]]:
    evp = 1 / (1 + np.exp(-form))  # Logistic
    sims = np.random.logistic(evp, 0.1, n_sims)  # Uncertainty
    evr = (np.percentile(sims, 5), np.percentile(sims, 95))
    return evp, evr


if __name__ == "__main__":
    print(theoretical_evp(2.5))  # Example: Team form 2.5
