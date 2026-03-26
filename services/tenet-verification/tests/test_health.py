"""Phase 0 stub — basic health check test."""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "tenet-verification"
