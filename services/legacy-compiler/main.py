import os
import json
import logging
import asyncio
import re
import time
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from collections import defaultdict
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from pydantic import BaseModel, Field, ConfigDict
from pydantic_settings import BaseSettings
import httpx
from bs4 import BeautifulSoup
import unicodedata

# --- Configuration ---

class Settings(BaseSettings):
    TENET_VERIFICATION_URL: str = os.getenv("TENET_VERIFICATION_URL", "http://localhost:8001")
    PANDASCORE_API_KEY: str = os.getenv("PANDASCORE_API_KEY", "")
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")
    SCRAPE_INTERVAL_HOURS: int = 6
    SCRAPER_RATE_LIMIT: float = 1.0  # requests per second
    SCRAPER_TIMEOUT: int = 15
    APP_VERSION: str = "0.2.0"

settings = Settings()

# --- Logging ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("legacy-compiler")

# --- Data Models ---

class TenetBaseModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=(),
    )

class CompileRequest(TenetBaseModel):
    match_id: str = Field(alias="matchId")
    game: str
    sources: List[str] = Field(default=["pandascore", "vlr", "liquidpedia"])

class CompileStatus(TenetBaseModel):
    match_id: str = Field(alias="matchId")
    status: str  # processing, verified, failed
    confidence: Optional[float] = Field(default=None)
    started_at: datetime = Field(alias="startedAt")

class PlayerNormalizationResult(TenetBaseModel):
    raw_name: str
    normalized_name: str
    confidence: float

class TeamNormalizationResult(TenetBaseModel):
    raw_name: str
    normalized_name: str
    abbreviation: Optional[str] = None
    confidence: float

@dataclass
class ScraperHealthStatus:
    source: str
    is_available: bool
    last_successful_scrape: Optional[datetime]
    response_time_ms: float
    error_message: Optional[str] = None

# --- Player & Team Normalization Database ---

KNOWN_PLAYERS = {
    "derke": "Derke", "boaster": "boaster", "zeek": "zeek",
    "aspas": "aspas", "crashies": "crashies", "bang": "bang",
    "jmoh": "jmoh", "ardiis": "ardiis", "chronicle": "chronicle",
    "zyppan": "zyppan", "nivera": "nivera", "nats": "nAts",
}

KNOWN_TEAMS = {
    "fnc": ("Fnatic", "FNC"),
    "sen": ("Sentinels", "SEN"),
    "furia": ("FURIA", "FURIA"),
    "navi": ("Natus Vincere", "NAVI"),
    "loud": ("LOUD", "LOUD"),
    "lev": ("Leviatán", "LEV"),
    "kcorp": ("KC", "KC"),
    "karmine": ("Karmine Corp", "KC"),
    "edg": ("EDward Gaming", "EDG"),
    "fpx": ("FunPlus Phoenix", "FPX"),
    "prx": ("Paper Rex", "PRX"),
    "drx": ("DRX", "DRX"),
    "t1": ("T1", "T1"),
    "gen": ("Genesis", "GEN"),
}

# --- Rate Limiter ---

class RateLimiter:
    def __init__(self, requests_per_second: float):
        self.requests_per_second = requests_per_second
        self.min_interval = 1.0 / requests_per_second
        self.last_request_time = 0.0

    async def wait(self):
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            await asyncio.sleep(self.min_interval - elapsed)
        self.last_request_time = time.time()

vlr_limiter = RateLimiter(1.0)
liquidpedia_limiter = RateLimiter(0.5)

# --- Circuit Breaker Pattern ---

class CircuitBreakerState:
    CLOSED = "CLOSED"      # Normal operation
    OPEN = "OPEN"          # Fail fast, reject requests
    HALF_OPEN = "HALF_OPEN"  # Recovery attempt

class CircuitBreaker:
    """Prevents cascading failures from external API errors"""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold  # Failures before opening
        self.recovery_timeout = recovery_timeout    # Seconds before trying recovery
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.last_open_time: Optional[float] = None

    def record_success(self):
        """Record successful request"""
        self.failure_count = 0
        self.last_failure_time = None
        if self.state != CircuitBreakerState.CLOSED:
            logger.info(f"Circuit breaker recovering to CLOSED state")
            self.state = CircuitBreakerState.CLOSED

    def record_failure(self):
        """Record failed request"""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            if self.state != CircuitBreakerState.OPEN:
                logger.warning(f"Circuit breaker OPEN: {self.failure_count}/{self.failure_threshold} failures")
                self.state = CircuitBreakerState.OPEN
                self.last_open_time = time.time()

    def is_closed(self) -> bool:
        """Check if circuit is closed (accepting requests)"""
        if self.state == CircuitBreakerState.CLOSED:
            return True

        if self.state == CircuitBreakerState.OPEN:
            # Try recovery after timeout
            if time.time() - self.last_open_time > self.recovery_timeout:
                logger.info("Circuit breaker attempting recovery (HALF_OPEN)")
                self.state = CircuitBreakerState.HALF_OPEN
                self.failure_count = 0  # Reset on recovery attempt
                return True
            return False

        # HALF_OPEN: try one request
        return True

    def get_state(self) -> str:
        """Get current state"""
        return self.state

# Circuit breakers for each data source
vlr_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60)
liquidpedia_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60)
pandascore_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60)

# --- Exponential Backoff Helper ---

async def retry_with_backoff(func, max_retries: int = 3, base_delay: float = 1.0):
    """
    Retry async function with exponential backoff and jitter
    Delay: 2^n * (1 ± 0.25) seconds
    """
    import random

    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise

            # Calculate backoff: 2^attempt * (1 ± 0.25) * base_delay
            jitter = random.uniform(0.75, 1.25)
            delay = (2 ** attempt) * base_delay * jitter
            logger.warning(f"Retry attempt {attempt + 1}/{max_retries} after {delay:.2f}s: {e}")
            await asyncio.sleep(delay)

# --- Normalization Utilities ---

def normalize_player_name(raw_name: str) -> str:
    """
    Normalize player name: lowercase, remove special chars, handle Unicode.
    Returns canonical player name if found in database.
    """
    if not raw_name:
        return ""

    # Check direct lookup first
    lower_name = raw_name.lower().strip()
    if lower_name in KNOWN_PLAYERS:
        return KNOWN_PLAYERS[lower_name]

    # Normalize Unicode and remove accents
    normalized = unicodedata.normalize('NFKD', lower_name)
    normalized = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')

    # Remove special characters and extra spaces
    normalized = re.sub(r'[^\w\s]', '', normalized)
    normalized = re.sub(r'\s+', ' ', normalized).strip()

    return normalized

def normalize_team_name(raw_name: str) -> Tuple[str, Optional[str], float]:
    """
    Normalize team name: expand abbreviations, handle spelling variants.
    Returns (canonical_name, abbreviation, confidence).
    """
    if not raw_name:
        return ("", None, 0.0)

    lower_name = raw_name.lower().strip()

    # Direct lookup in teams database
    for abbr, (full_name, standard_abbr) in KNOWN_TEAMS.items():
        if abbr == lower_name or full_name.lower() == lower_name or standard_abbr.lower() == lower_name:
            return (full_name, standard_abbr, 0.95)

    # Fuzzy matching for partial matches
    for abbr, (full_name, standard_abbr) in KNOWN_TEAMS.items():
        if abbr in lower_name or lower_name in full_name.lower():
            return (full_name, standard_abbr, 0.75)

    # Return as-is if not found
    return (raw_name.strip(), None, 0.5)

# --- Scrapers ---

class VLRScraper:
    """Scrape player match history and tournament data from VLR.gg"""

    async def scrape_match_history(self, player_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Scrape VLR.gg player page for match history.
        Returns list of match summaries.
        Circuit breaker: Fail fast if VLR is unavailable.
        Retry: Exponential backoff on transient failures.
        """
        logger.info(f"VLRScraper: Fetching match history for player {player_id}")

        # Check circuit breaker
        if not vlr_breaker.is_closed():
            logger.warning(f"VLRScraper: Circuit breaker is {vlr_breaker.get_state()}, skipping request")
            vlr_breaker.record_failure()
            return []

        try:
            await vlr_limiter.wait()

            async def fetch_and_parse():
                url = f"https://www.vlr.gg/player/{player_id}/matches"
                async with httpx.AsyncClient(follow_redirects=True) as client:
                    resp = await client.get(url, timeout=settings.SCRAPER_TIMEOUT, headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    })
                    resp.raise_for_status()
                return resp.text

            # Retry with exponential backoff
            html = await retry_with_backoff(fetch_and_parse, max_retries=3, base_delay=1.0)

            soup = BeautifulSoup(html, 'html.parser')
            matches = []

            # Parse match rows (VLR.gg table structure)
            match_rows = soup.select('tr[class*="match"]')
            for row in match_rows[:limit]:
                try:
                    match_data = self._parse_match_row(row)
                    if match_data:
                        matches.append(match_data)
                except Exception as e:
                    logger.debug(f"Failed to parse match row: {e}")
                    continue

            logger.info(f"VLRScraper: Found {len(matches)} matches for player {player_id}")
            vlr_breaker.record_success()
            return matches

        except Exception as e:
            logger.error(f"VLRScraper: Error fetching match history: {e}")
            vlr_breaker.record_failure()
            return []

    async def scrape_tournament(self, tournament_id: str) -> Dict[str, Any]:
        """
        Scrape tournament bracket and results from VLR.gg
        Circuit breaker: Fail fast if VLR is unavailable.
        Retry: Exponential backoff on transient failures.
        """
        logger.info(f"VLRScraper: Fetching tournament {tournament_id}")

        # Check circuit breaker
        if not vlr_breaker.is_closed():
            logger.warning(f"VLRScraper: Circuit breaker is {vlr_breaker.get_state()}, skipping request")
            vlr_breaker.record_failure()
            return {"source": "vlr", "tournament_id": tournament_id, "error": "Circuit breaker open", "matches": []}

        try:
            await vlr_limiter.wait()

            async def fetch_and_parse():
                url = f"https://www.vlr.gg/event/{tournament_id}"
                async with httpx.AsyncClient(follow_redirects=True) as client:
                    resp = await client.get(url, timeout=settings.SCRAPER_TIMEOUT, headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    })
                    resp.raise_for_status()
                return resp.text

            # Retry with exponential backoff
            html = await retry_with_backoff(fetch_and_parse, max_retries=3, base_delay=1.0)

            soup = BeautifulSoup(html, 'html.parser')

            # Extract tournament name and basic info
            title_tag = soup.find('h1')
            tournament_name = title_tag.text.strip() if title_tag else "Unknown"

            # Extract matches from bracket
            matches = []
            match_cards = soup.select('[class*="match-card"]')
            for card in match_cards:
                match_data = self._parse_tournament_match(card)
                if match_data:
                    matches.append(match_data)

            logger.info(f"VLRScraper: Found {len(matches)} matches in tournament {tournament_id}")
            vlr_breaker.record_success()
            return {
                "source": "vlr",
                "tournament_id": tournament_id,
                "tournament_name": tournament_name,
                "matches": matches,
                "match_count": len(matches)
            }

        except Exception as e:
            logger.error(f"VLRScraper: Error fetching tournament: {e}")
            vlr_breaker.record_failure()
            return {"source": "vlr", "tournament_id": tournament_id, "error": str(e), "matches": []}

    def _parse_match_row(self, row) -> Optional[Dict[str, Any]]:
        """Parse a single match row from VLR.gg table"""
        try:
            cells = row.find_all('td')
            if len(cells) < 4:
                return None

            # Extract match data
            date_str = cells[0].text.strip()
            teams_cell = cells[1].text.strip()
            score_str = cells[2].text.strip()

            return {
                "date": date_str,
                "teams": teams_cell,
                "score": score_str,
                "source": "vlr"
            }
        except Exception as e:
            logger.debug(f"Failed to parse match row: {e}")
            return None

    def _parse_tournament_match(self, card) -> Optional[Dict[str, Any]]:
        """Parse match card from tournament bracket"""
        try:
            team_elements = card.select('[class*="team"]')
            if len(team_elements) < 2:
                return None

            score_element = card.find(class_=re.compile(r'score'))

            return {
                "team_a": team_elements[0].text.strip(),
                "team_b": team_elements[1].text.strip() if len(team_elements) > 1 else "TBD",
                "score": score_element.text.strip() if score_element else "—",
                "source": "vlr"
            }
        except Exception:
            return None

class LiquidpediaScraper:
    """Scrape team rosters and tournament history from Liquidpedia"""

    async def scrape_team_roster(self, team_name: str) -> Dict[str, Any]:
        """
        Scrape Liquidpedia team page for current roster
        Circuit breaker: Fail fast if Liquidpedia is unavailable.
        Retry: Exponential backoff on transient failures.
        """
        logger.info(f"LiquidpediaScraper: Fetching roster for {team_name}")

        # Check circuit breaker
        if not liquidpedia_breaker.is_closed():
            logger.warning(f"LiquidpediaScraper: Circuit breaker is {liquidpedia_breaker.get_state()}, skipping request")
            liquidpedia_breaker.record_failure()
            return {"source": "liquidpedia", "team_name": team_name, "error": "Circuit breaker open", "players": []}

        try:
            await liquidpedia_limiter.wait()

            async def fetch_and_parse():
                # Liquidpedia URL format: /valorant/[Team_Name]
                url = f"https://liquipedia.net/valorant/{team_name.replace(' ', '_')}"
                async with httpx.AsyncClient(follow_redirects=True) as client:
                    resp = await client.get(url, timeout=settings.SCRAPER_TIMEOUT, headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    })
                    resp.raise_for_status()
                return resp.text

            # Retry with exponential backoff
            html = await retry_with_backoff(fetch_and_parse, max_retries=3, base_delay=1.0)

            soup = BeautifulSoup(html, 'html.parser')

            # Extract roster from infobox
            roster_table = soup.find('table', class_=re.compile(r'infobox'))
            players = []

            if roster_table:
                player_rows = roster_table.select('tr')
                for row in player_rows:
                    name_cell = row.find('td')
                    if name_cell and name_cell.text.strip():
                        players.append({
                            "name": normalize_player_name(name_cell.text.strip()),
                            "raw_name": name_cell.text.strip()
                        })

            logger.info(f"LiquidpediaScraper: Found {len(players)} players for {team_name}")
            liquidpedia_breaker.record_success()
            return {
                "source": "liquidpedia",
                "team_name": team_name,
                "players": players,
                "player_count": len(players)
            }

        except Exception as e:
            logger.error(f"LiquidpediaScraper: Error fetching roster: {e}")
            liquidpedia_breaker.record_failure()
            return {"source": "liquidpedia", "team_name": team_name, "error": str(e), "players": []}

    async def scrape_tournament_history(self, game: str) -> List[Dict[str, Any]]:
        """
        Scrape tournament listings from Liquidpedia
        Circuit breaker: Fail fast if Liquidpedia is unavailable.
        Retry: Exponential backoff on transient failures.
        """
        logger.info(f"LiquidpediaScraper: Fetching tournament history for {game}")

        # Check circuit breaker
        if not liquidpedia_breaker.is_closed():
            logger.warning(f"LiquidpediaScraper: Circuit breaker is {liquidpedia_breaker.get_state()}, skipping request")
            liquidpedia_breaker.record_failure()
            return []

        try:
            await liquidpedia_limiter.wait()

            async def fetch_and_parse():
                url = f"https://liquipedia.net/{game}/Tournaments"
                async with httpx.AsyncClient(follow_redirects=True) as client:
                    resp = await client.get(url, timeout=settings.SCRAPER_TIMEOUT, headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    })
                    resp.raise_for_status()
                return resp.text

            # Retry with exponential backoff
            html = await retry_with_backoff(fetch_and_parse, max_retries=3, base_delay=1.0)

            soup = BeautifulSoup(html, 'html.parser')
            tournaments = []

            # Extract tournament links
            tournament_links = soup.select('a[href*="Tournament"]')
            for link in tournament_links[:20]:  # Limit to recent 20
                tournament_name = link.text.strip()
                tournament_url = link.get('href', '')

                if tournament_name:
                    tournaments.append({
                        "name": tournament_name,
                        "url": tournament_url,
                        "game": game,
                        "source": "liquidpedia"
                    })

            logger.info(f"LiquidpediaScraper: Found {len(tournaments)} tournaments for {game}")
            liquidpedia_breaker.record_success()
            return tournaments

        except Exception as e:
            logger.error(f"LiquidpediaScraper: Error fetching tournaments: {e}")
            liquidpedia_breaker.record_failure()
            return []

class YouTubeExtractor:
    """Extract match metadata from YouTube livestream descriptions"""

    async def extract_from_livestream_description(self, video_id: str) -> Dict[str, Any]:
        """
        Extract match data from YouTube video description.
        Falls back to regex parsing if API key not available.
        """
        logger.info(f"YouTubeExtractor: Extracting metadata from video {video_id}")

        if settings.YOUTUBE_API_KEY:
            return await self._extract_via_api(video_id)
        else:
            # Fallback: attempt regex-based description parsing
            return await self._extract_via_regex(video_id)

    async def _extract_via_api(self, video_id: str) -> Dict[str, Any]:
        """Use YouTube API to fetch video metadata"""
        try:
            url = "https://www.googleapis.com/youtube/v3/videos"
            params = {
                "id": video_id,
                "key": settings.YOUTUBE_API_KEY,
                "part": "snippet"
            }

            async with httpx.AsyncClient() as client:
                resp = await client.get(url, params=params, timeout=settings.SCRAPER_TIMEOUT)
                resp.raise_for_status()

            data = resp.json()
            if data.get('items'):
                snippet = data['items'][0]['snippet']
                description = snippet.get('description', '')
                title = snippet.get('title', '')

                match_info = self._parse_description(description, title)
                match_info['source'] = 'youtube'
                match_info['video_id'] = video_id
                return match_info

        except Exception as e:
            logger.error(f"YouTubeExtractor: API error: {e}")

        return {"source": "youtube", "video_id": video_id, "error": "API unavailable"}

    async def _extract_via_regex(self, video_id: str) -> Dict[str, Any]:
        """Fallback: parse YouTube page directly (limited effectiveness)"""
        try:
            url = f"https://www.youtube.com/watch?v={video_id}"
            async with httpx.AsyncClient(follow_redirects=True) as client:
                resp = await client.get(url, timeout=settings.SCRAPER_TIMEOUT, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                resp.raise_for_status()

            # Extract description from page (YouTube doesn't expose full description in HTML)
            # This is a simplified approach; full implementation would require Selenium
            logger.warning("YouTubeExtractor: Regex parsing limited without API key")
            return {
                "source": "youtube",
                "video_id": video_id,
                "note": "Full extraction requires YouTube API key"
            }

        except Exception as e:
            logger.error(f"YouTubeExtractor: Regex extraction error: {e}")
            return {"source": "youtube", "video_id": video_id, "error": str(e)}

    def _parse_description(self, description: str, title: str) -> Dict[str, Any]:
        """
        Parse YouTube description and title for match data.
        Looks for patterns like "Team A vs Team B" and score patterns.
        """
        match_data = {"teams": [], "scores": []}

        # Pattern: "Team A vs Team B"
        vs_pattern = r'(.+?)\s+vs\s+(.+?)(?:\s|$|:)'
        matches = re.findall(vs_pattern, description + ' ' + title, re.IGNORECASE)
        for match in matches:
            team_a = normalize_team_name(match[0])[0]
            team_b = normalize_team_name(match[1])[0]
            if team_a and team_b:
                match_data['teams'].append({"team_a": team_a, "team_b": team_b})

        # Pattern: score like "13-6" or "2-1"
        score_pattern = r'(\d+)\s*-\s*(\d+)'
        scores = re.findall(score_pattern, description)
        match_data['scores'] = [{"a": int(s[0]), "b": int(s[1])} for s in scores]

        return match_data

# --- Data Aggregation ---

class DataAggregator:
    """Aggregate and normalize data from multiple scrapers"""

    def __init__(self):
        self.vlr = VLRScraper()
        self.liquidpedia = LiquidpediaScraper()
        self.youtube = YouTubeExtractor()
        self.scraper_status = {}

    async def aggregate_match_data(self, match_id: str) -> Dict[str, Any]:
        """
        Collect match data from all available sources.
        Returns aggregated SourceDataPayload for TeneT verification.
        """
        logger.info(f"DataAggregator: Aggregating data for match {match_id}")

        sources = []

        # Attempt VLR.gg scrape
        vlr_data = await self.vlr.scrape_match_history(match_id)
        if vlr_data:
            sources.append({
                "sourceType": "vlr",
                "trustLevel": "MEDIUM",
                "weight": 1.0,
                "data": vlr_data,
                "capturedAt": datetime.utcnow().isoformat()
            })

        # Attempt Liquidpedia scrape
        liquidpedia_data = await self.liquidpedia.scrape_tournament_history("valorant")
        if liquidpedia_data:
            sources.append({
                "sourceType": "liquidpedia",
                "trustLevel": "MEDIUM",
                "weight": 0.8,
                "data": {"tournaments": liquidpedia_data},
                "capturedAt": datetime.utcnow().isoformat()
            })

        return {
            "entityId": match_id,
            "entityType": "match",
            "sources": sources,
            "sourceCount": len(sources)
        }

    async def get_scraper_status(self) -> List[Dict[str, Any]]:
        """
        Check health of all scrapers and return status report.
        """
        statuses = []

        # Check VLR.gg
        vlr_start = time.time()
        try:
            url = "https://www.vlr.gg"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, timeout=5)
                vlr_time = (time.time() - vlr_start) * 1000
                statuses.append({
                    "source": "vlr",
                    "available": resp.status_code == 200,
                    "response_time_ms": vlr_time,
                    "last_check": datetime.utcnow().isoformat()
                })
        except Exception as e:
            statuses.append({
                "source": "vlr",
                "available": False,
                "error": str(e),
                "last_check": datetime.utcnow().isoformat()
            })

        # Check Liquidpedia
        liquidpedia_start = time.time()
        try:
            url = "https://liquipedia.net/valorant"
            async with httpx.AsyncClient() as client:
                resp = await client.get(url, timeout=5)
                liquidpedia_time = (time.time() - liquidpedia_start) * 1000
                statuses.append({
                    "source": "liquidpedia",
                    "available": resp.status_code == 200,
                    "response_time_ms": liquidpedia_time,
                    "last_check": datetime.utcnow().isoformat()
                })
        except Exception as e:
            statuses.append({
                "source": "liquidpedia",
                "available": False,
                "error": str(e),
                "last_check": datetime.utcnow().isoformat()
            })

        return statuses

# --- Conflict Detection ---

def detect_conflicts(sources: List[Dict[str, Any]], threshold_points: int = 10) -> Dict[str, Any]:
    """
    Detect conflicts between data sources.
    Flag when scores differ by > threshold_points between sources.

    Returns:
    {
        "has_conflicts": bool,
        "conflicts": [
            {"field": "team_a_score", "values": [13, 12], "sources": ["vlr", "pandascore"]},
            ...
        ],
        "confidence_impact": float (0-1, how much this reduces confidence)
    }
    """
    conflicts = []

    # Extract scores from each source
    scores_by_source = {}
    for source in sources:
        source_type = source.get("sourceType", "unknown")
        data = source.get("data", {})

        # Look for team scores
        if "team_a_score" in data and "team_b_score" in data:
            scores_by_source[source_type] = {
                "team_a": data["team_a_score"],
                "team_b": data["team_b_score"]
            }

    # Compare all pairs of sources
    source_types = list(scores_by_source.keys())
    for i, source1 in enumerate(source_types):
        for source2 in source_types[i+1:]:
            scores1 = scores_by_source[source1]
            scores2 = scores_by_source[source2]

            # Check team A score difference
            diff_a = abs(scores1["team_a"] - scores2["team_a"])
            if diff_a > threshold_points:
                conflicts.append({
                    "field": "team_a_score",
                    "values": [scores1["team_a"], scores2["team_a"]],
                    "sources": [source1, source2],
                    "difference": diff_a
                })

            # Check team B score difference
            diff_b = abs(scores1["team_b"] - scores2["team_b"])
            if diff_b > threshold_points:
                conflicts.append({
                    "field": "team_b_score",
                    "values": [scores1["team_b"], scores2["team_b"]],
                    "sources": [source1, source2],
                    "difference": diff_b
                })

    has_conflicts = len(conflicts) > 0
    # Reduce confidence by 0.1 per conflict (min 0.0)
    confidence_impact = min(0.1 * len(conflicts), 0.5)

    return {
        "has_conflicts": has_conflicts,
        "conflict_count": len(conflicts),
        "conflicts": conflicts,
        "confidence_impact": confidence_impact
    }

# --- Global Aggregator Instance ---

aggregator = DataAggregator()

# --- Background Task Scheduler ---

async def scheduled_scraper():
    """
    Background task: periodically scrape recent matches
    Every 6 hours: VLR.gg, every 24 hours: Liquidpedia
    """
    logger.info("Scheduled scraper started")
    while True:
        try:
            # Every 6 hours
            await asyncio.sleep(6 * 3600)
            logger.info("Running scheduled VLR.gg scrape...")
            # Would trigger scrape of recent tournaments
        except Exception as e:
            logger.error(f"Scheduled scraper error: {e}")

# --- Orchestration ---

async def run_compilation_pipeline(match_id: str, game: str, source_list: List[str]):
    """Execute legacy data compilation pipeline"""
    logger.info(f"Starting compilation pipeline for match {match_id}")

    # Aggregate data from sources
    aggregated = await aggregator.aggregate_match_data(match_id)

    if not aggregated.get('sources'):
        logger.warning(f"No data collected for match {match_id}")
        return

    # Prepare for TeneT Verification
    verification_payload = {
        "entityId": match_id,
        "entityType": "match",
        "game": game,
        "sources": aggregated['sources']
    }

    # Trigger Verification
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.TENET_VERIFICATION_URL}/v1/verify",
                json=verification_payload,
                timeout=10.0
            )
            if resp.status_code == 200:
                verify_result = resp.json()
                logger.info(f"Match {match_id} verified: {verify_result.get('status')} (confidence: {verify_result.get('confidenceScore')})")
            else:
                logger.error(f"Verification failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        logger.error(f"Error connecting to verification service: {e}")

# --- FastAPI App ---

app = FastAPI(
    title="NJZ Legacy Data Compiler",
    description="Static Truth Legacy data pipeline — Path B Historical Data Aggregation",
    version=settings.APP_VERSION,
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "legacy-compiler", "version": settings.APP_VERSION}

@app.get("/ready")
async def ready():
    return {"status": "ready"}

@app.post("/v1/compile", response_model=CompileStatus)
async def trigger_compilation(request: CompileRequest, background_tasks: BackgroundTasks):
    """Trigger compilation for a specific match"""
    background_tasks.add_task(run_compilation_pipeline, request.match_id, request.game, request.sources)

    return CompileStatus(
        match_id=request.match_id,
        status="processing",
        started_at=datetime.utcnow()
    )

@app.post("/v1/compile/match/{match_id}", response_model=CompileStatus)
async def compile_match(match_id: str, game: str = Query(...), background_tasks: BackgroundTasks = None):
    """Compile a specific match from all sources"""
    if not background_tasks:
        background_tasks = BackgroundTasks()

    background_tasks.add_task(run_compilation_pipeline, match_id, game, ["vlr", "liquidpedia", "youtube"])

    return CompileStatus(
        match_id=match_id,
        status="processing",
        started_at=datetime.utcnow()
    )

@app.post("/v1/compile/player/{player_id}")
async def compile_player(player_id: str, game: str = Query("valorant")):
    """Compile player match history from multiple sources"""
    logger.info(f"Compiling player history for {player_id}")

    vlr_scraper = VLRScraper()
    matches = await vlr_scraper.scrape_match_history(player_id, limit=50)

    return {
        "player_id": player_id,
        "game": game,
        "match_count": len(matches),
        "matches": matches,
        "source": "legacy-compiler"
    }

@app.get("/v1/scraper/status")
async def scraper_status():
    """Get health status of all scrapers"""
    statuses = await aggregator.get_scraper_status()
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "scrapers": statuses,
        "app_version": settings.APP_VERSION
    }

@app.post("/v1/normalize/player")
async def normalize_player_endpoint(name: str = Query(...)) -> PlayerNormalizationResult:
    """Normalize a player name"""
    normalized = normalize_player_name(name)
    confidence = 0.9 if normalized in KNOWN_PLAYERS.values() else 0.6

    return PlayerNormalizationResult(
        raw_name=name,
        normalized_name=normalized,
        confidence=confidence
    )

@app.post("/v1/normalize/team")
async def normalize_team_endpoint(name: str = Query(...)) -> TeamNormalizationResult:
    """Normalize a team name"""
    norm_name, abbr, confidence = normalize_team_name(name)

    return TeamNormalizationResult(
        raw_name=name,
        normalized_name=norm_name,
        abbreviation=abbr,
        confidence=confidence
    )
