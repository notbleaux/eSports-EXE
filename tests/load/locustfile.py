"""Load testing scenarios with Locust."""
from locust import HttpUser, task, between, events
import random
import json


class SatorUser(HttpUser):
    """Simulates typical user behavior."""
    wait_time = between(1, 5)  # 1-5 seconds between requests
    
    def on_start(self):
        """Initialize user session."""
        self.player_ids = ["player_1", "player_2", "player_3", "player_4", "player_5"]
        self.match_ids = list(range(1, 101))
    
    @task(5)
    def get_player_stats(self):
        """Most common: viewing player stats."""
        player_id = random.choice(self.player_ids)
        with self.client.get(
            f"/api/players/{player_id}/stats",
            catch_response=True,
            name="/api/players/[id]/stats"
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 503:
                response.failure("Service Unavailable")
            elif response.elapsed.total_seconds() > 0.5:
                response.failure("Response too slow (>500ms)")
            else:
                response.failure(f"Unexpected status: {response.status_code}")
    
    @task(3)
    def get_leaderboard(self):
        """Common: viewing leaderboard."""
        self.client.get("/api/leaderboard", name="/api/leaderboard")
    
    @task(2)
    def get_match_details(self):
        """Less common: match details."""
        match_id = random.choice(self.match_ids)
        self.client.get(
            f"/api/matches/{match_id}",
            name="/api/matches/[id]"
        )
    
    @task(1)
    def search_players(self):
        """Rare: searching players."""
        query = random.choice(["tenz", "aspas", "fns", "", "test"])
        self.client.get(
            f"/api/players/search?q={query}",
            name="/api/players/search"
        )


class AnalyticsUser(HttpUser):
    """Simulates heavy analytics users."""
    wait_time = between(5, 10)
    
    @task
    def get_dashboard(self):
        """Analytics dashboard - computationally expensive."""
        with self.client.get(
            "/api/analytics/dashboard",
            catch_response=True,
            name="/api/analytics/dashboard"
        ) as response:
            if response.elapsed.total_seconds() > 2.0:
                response.failure("Dashboard too slow (>2s)")
            elif response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status: {response.status_code}")


class WebSocketUser(HttpUser):
    """Simulates WebSocket connections for real-time updates."""
    wait_time = between(10, 30)
    
    @task
    def connect_websocket(self):
        """Test WebSocket connection."""
        # WebSocket testing requires locust-plugins
        pass


# Event hooks for metrics
@events.request.add_listener
def on_request(request_type, name, response_time, response_length, 
               response, context, exception, **kwargs):
    """Log slow requests."""
    if response_time > 500:
        print(f"⚠️ Slow request: {name} took {response_time}ms")


@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    """Print summary when test ends."""
    print("\n📊 Load Test Summary:")
    print(f"Total requests: {environment.stats.total.num_requests}")
    print(f"Failed requests: {environment.stats.total.num_failures}")
    print(f"Avg response time: {environment.stats.total.avg_response_time:.0f}ms")
    print(f"95th percentile: {environment.stats.total.get_response_time_percentile(0.95):.0f}ms")
    
    # Target validation
    p95 = environment.stats.total.get_response_time_percentile(0.95)
    if p95 > 200:
        print(f"❌ FAILED: p95 response time {p95:.0f}ms exceeds 200ms target")
    else:
        print(f"✅ PASSED: p95 response time {p95:.0f}ms within 200ms target")


# Usage:
# locust -f tests/load/locustfile.py --host=http://localhost:8000 -u 100 -r 10 -t 5m
# 
# Options:
# -u 100: 100 concurrent users
# -r 10: 10 users per second spawn rate
# -t 5m: Run for 5 minutes
# --headless: Run without web UI