"""
Token economy test fixtures.
Provides test token balances and transaction data.
"""
import pytest
from typing import Dict, Any


@pytest.fixture
def test_token_balance() -> Dict[str, Any]:
    """Sample token balance for testing."""
    return {
        "user_id": "test-user-id",
        "balance": 1000,
        "total_earned": 1500,
        "total_spent": 500
    }


@pytest.fixture
def test_token_transaction() -> Dict[str, Any]:
    """Sample token transaction for testing."""
    return {
        "user_id": "test-user-id",
        "amount": 100,
        "type": "earn",
        "source": "daily_claim",
        "description": "Daily login bonus"
    }


@pytest.fixture
def test_bet_transaction() -> Dict[str, Any]:
    """Sample betting transaction for testing."""
    return {
        "user_id": "test-user-id",
        "amount": 50,
        "type": "bet_win",
        "source": "match_prediction",
        "description": "Match prediction win"
    }
