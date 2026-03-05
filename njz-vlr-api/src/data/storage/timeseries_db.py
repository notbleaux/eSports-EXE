"""
Time-Series Database Integration
InfluxDB for historical match statistics tracking
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import asdict
import structlog

try:
    from influxdb_client import InfluxDBClient, Point
    from influxdb_client.client.write_api import SYNCHRONOUS
    INFLUX_AVAILABLE = True
except ImportError:
    INFLUX_AVAILABLE = False

from core.config import settings

logger = structlog.get_logger(__name__)


class TimeSeriesDB:
    """
    Time-series database for historical analytics
    Stores: player performance over time, team rankings evolution, match trends
    """
    
    def __init__(self):
        self.client: Optional[InfluxDBClient] = None
        self.write_api = None
        self.query_api = None
        self.enabled = False
        
        if INFLUX_AVAILABLE and hasattr(settings, 'INFLUXDB_URL'):
            try:
                self.client = InfluxDBClient(
                    url=settings.INFLUXDB_URL,
                    token=settings.INFLUXDB_TOKEN,
                    org=settings.INFLUXDB_ORG
                )
                self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
                self.query_api = self.client.query_api()
                self.enabled = True
                logger.info("influxdb.connected")
            except Exception as e:
                logger.error("influxdb.connection_failed", error=str(e))
    
    def write_player_stats(
        self,
        player_id: str,
        player_name: str,
        team: str,
        match_id: str,
        stats: Dict[str, float],
        timestamp: Optional[datetime] = None
    ) -> bool:
        """
        Write player statistics to time-series DB
        """
        if not self.enabled:
            return False
        
        try:
            point = Point("player_stats") \
                .tag("player_id", player_id) \
                .tag("player_name", player_name) \
                .tag("team", team) \
                .tag("match_id", match_id) \
                .field("rating", stats.get("rating", 0)) \
                .field("acs", stats.get("acs", 0)) \
                .field("kills", stats.get("kills", 0)) \
                .field("deaths", stats.get("deaths", 0)) \
                .field("assists", stats.get("assists", 0)) \
                .field("adr", stats.get("adr", 0)) \
                .field("kast", stats.get("kast", 0)) \
                .field("kd_ratio", stats.get("kd_ratio", 0)) \
                .time(timestamp or datetime.utcnow())
            
            self.write_api.write(
                bucket=settings.INFLUXDB_BUCKET,
                record=point
            )
            
            return True
            
        except Exception as e:
            logger.error("influxdb.write_failed", error=str(e))
            return False
    
    def write_team_ranking(
        self,
        team_id: str,
        team_name: str,
        region: str,
        rank: int,
        rating: float,
        timestamp: Optional[datetime] = None
    ) -> bool:
        """
        Write team ranking to time-series DB
        """
        if not self.enabled:
            return False
        
        try:
            point = Point("team_rankings") \
                .tag("team_id", team_id) \
                .tag("team_name", team_name) \
                .tag("region", region) \
                .field("rank", rank) \
                .field("rating", rating) \
                .time(timestamp or datetime.utcnow())
            
            self.write_api.write(
                bucket=settings.INFLUXDB_BUCKET,
                record=point
            )
            
            return True
            
        except Exception as e:
            logger.error("influxdb.write_failed", error=str(e))
            return False
    
    def write_match_result(
        self,
        match_id: str,
        event: str,
        team1: str,
        team2: str,
        team1_score: int,
        team2_score: int,
        map_name: str,
        duration_minutes: int,
        timestamp: Optional[datetime] = None
    ) -> bool:
        """
        Write match result to time-series DB
        """
        if not self.enabled:
            return False
        
        try:
            point = Point("match_results") \
                .tag("match_id", match_id) \
                .tag("event", event) \
                .tag("team1", team1) \
                .tag("team2", team2) \
                .tag("map", map_name) \
                .field("team1_score", team1_score) \
                .field("team2_score", team2_score) \
                .field("duration_minutes", duration_minutes) \
                .field("total_rounds", team1_score + team2_score) \
                .time(timestamp or datetime.utcnow())
            
            self.write_api.write(
                bucket=settings.INFLUXDB_BUCKET,
                record=point
            )
            
            return True
            
        except Exception as e:
            logger.error("influxdb.write_failed", error=str(e))
            return False
    
    def query_player_trend(
        self,
        player_id: str,
        metric: str = "rating",
        days: int = 30
    ) -> List[Dict]:
        """
        Query player performance trend over time
        """
        if not self.enabled:
            return []
        
        query = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
            |> range(start: -{days}d)
            |> filter(fn: (r) => r._measurement == "player_stats")
            |> filter(fn: (r) => r.player_id == "{player_id}")
            |> filter(fn: (r) => r._field == "{metric}")
            |> aggregateWindow(every: 1d, fn: mean)
            |> yield(name: "mean")
        '''
        
        try:
            tables = self.query_api.query(query)
            results = []
            for table in tables:
                for record in table.records:
                    results.append({
                        "time": record.get_time(),
                        "value": record.get_value()
                    })
            return results
        except Exception as e:
            logger.error("influxdb.query_failed", error=str(e))
            return []
    
    def query_team_ranking_history(
        self,
        team_id: str,
        days: int = 90
    ) -> List[Dict]:
        """
        Query team ranking history
        """
        if not self.enabled:
            return []
        
        query = f'''
        from(bucket: "{settings.INFLUXDB_BUCKET}")
            |> range(start: -{days}d)
            |> filter(fn: (r) => r._measurement == "team_rankings")
            |> filter(fn: (r) => r.team_id == "{team_id}")
            |> filter(fn: (r) => r._field == "rank" or r._field == "rating")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        
        try:
            tables = self.query_api.query(query)
            results = []
            for table in tables:
                for record in table.records:
                    results.append({
                        "time": record.get_time(),
                        "rank": record.values.get("rank"),
                        "rating": record.values.get("rating")
                    })
            return results
        except Exception as e:
            logger.error("influxdb.query_failed", error=str(e))
            return []


# Global instance
tsdb = TimeSeriesDB()