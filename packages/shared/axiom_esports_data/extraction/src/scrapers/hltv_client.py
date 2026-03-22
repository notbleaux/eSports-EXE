"""HLTV.org Async Client for CS2 Data Pipeline

Rate limited, respectful scraping client for HLTV.org.
Follows the same pattern as VLRScraper for consistency.

Rate Limit: 30 requests per minute (2 second delay between requests)
"""

import asyncio
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential
from pydantic import BaseModel, Field

logger = structlog.get_logger()


class HLTVMatchResult(BaseModel):
    """HLTV match result data model"""
    match_id: str
    team_a: str
    team_b: str
    score_a: int
    score_b: int
    event_name: str
    event_id: Optional[str] = None
    map_name: Optional[str] = None
    timestamp: Optional[str] = None
    format: Optional[str] = None  # bo1, bo3, bo5
    url: Optional[str] = None


class HLTVPlayerStats(BaseModel):
    """HLTV player stats for a single match/map"""
    player_id: str
    player_name: str
    team: str
    kills: int = 0
    deaths: int = 0
    assists: int = 0
    adr: float = 0.0  # Average Damage per Round
    kast: float = 0.0  # Kill, Assist, Survive, Trade percentage
    rating: float = 0.0  # HLTV 2.0 rating
    hs_percent: Optional[float] = None  # Headshot percentage
    fk_diff: Optional[int] = None  # First kill difference


class HLTVMapStats(BaseModel):
    """Stats for a single map in a series"""
    map_name: str
    team_a: str
    team_b: str
    score_a: int
    score_b: int
    player_stats: List[HLTVPlayerStats] = Field(default_factory=list)


class HLTVMatchDetails(BaseModel):
    """Complete match details including all maps and stats"""
    match_id: str
    team_a: str
    team_b: str
    event_name: str
    date: Optional[str] = None
    format: str = "bo1"
    maps: List[HLTVMapStats] = Field(default_factory=list)
    veto: List[str] = Field(default_factory=list)


class HLTVClient:
    """Async client for HLTV.org with rate limiting
    
    Rate limit: 30 requests per minute (2 second delay)
    """
    
    BASE_URL = "https://www.hltv.org"
    RATE_LIMIT_DELAY = 2.0  # seconds between requests (30 req/min)
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.semaphore = asyncio.Semaphore(3)  # 3 concurrent max
        self._last_request_time: Optional[float] = None
        
    async def __aenter__(self):
        connector = aiohttp.TCPConnector(limit=30, limit_per_host=3)
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (compatible; SATOR-DataBot/1.0; "
                    "+https://libre-x.esports)"
                ),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
                "Accept-Encoding": "gzip, deflate, br",
                "DNT": "1",
                "Connection": "keep-alive",
            }
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
            
    async def _rate_limited_request(self, url: str) -> str:
        """Make a rate-limited request to HLTV"""
        async with self.semaphore:
            # Enforce rate limit
            if self._last_request_time:
                elapsed = asyncio.get_event_loop().time() - self._last_request_time
                if elapsed < self.RATE_LIMIT_DELAY:
                    wait_time = self.RATE_LIMIT_DELAY - elapsed
                    logger.debug(f"Rate limit: waiting {wait_time:.2f}s")
                    await asyncio.sleep(wait_time)
            
            try:
                async with self.session.get(url) as resp:
                    self._last_request_time = asyncio.get_event_loop().time()
                    
                    if resp.status == 429:
                        logger.warning("Rate limited by HLTV", url=url)
                        raise Exception("HLTV rate limit exceeded")
                    elif resp.status == 403:
                        logger.error("Access forbidden", url=url)
                        raise Exception("HLTV access forbidden (403)")
                    elif resp.status != 200:
                        logger.error(
                            "HLTV request failed", 
                            status=resp.status, 
                            url=url
                        )
                        raise Exception(f"HLTV request failed: {resp.status}")
                    
                    return await resp.text()
                    
            except aiohttp.ClientError as e:
                logger.error("Request error", error=str(e), url=url)
                raise
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def fetch_match(self, match_id: str) -> HLTVMatchDetails:
        """Fetch detailed match data from HLTV
        
        Args:
            match_id: HLTV match ID (e.g., "2379423")
            
        Returns:
            HLTVMatchDetails with all maps and player stats
        """
        url = f"{self.BASE_URL}/matches/{match_id}/match"
        logger.info("Fetching match", match_id=match_id, url=url)
        
        html = await self._rate_limited_request(url)
        soup = BeautifulSoup(html, "lxml")
        
        return self._parse_match_details(soup, match_id)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def fetch_results(
        self, 
        offset: int = 0, 
        limit: int = 50
    ) -> List[HLTVMatchResult]:
        """Fetch recent match results from HLTV
        
        Args:
            offset: Pagination offset
            limit: Max results to return (HLTV shows ~50 per page)
            
        Returns:
            List of HLTVMatchResult
        """
        url = f"{self.BASE_URL}/results?offset={offset}"
        logger.info("Fetching results", offset=offset, limit=limit)
        
        html = await self._rate_limited_request(url)
        soup = BeautifulSoup(html, "lxml")
        
        matches = self._parse_results_page(soup)
        return matches[:limit]
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def fetch_event_matches(self, event_id: str) -> List[HLTVMatchResult]:
        """Fetch matches for a specific event/tournament
        
        Args:
            event_id: HLTV event ID
            
        Returns:
            List of HLTVMatchResult
        """
        url = f"{self.BASE_URL}/events/{event_id}/matches"
        logger.info("Fetching event matches", event_id=event_id)
        
        html = await self._rate_limited_request(url)
        soup = BeautifulSoup(html, "lxml")
        
        return self._parse_event_matches(soup, event_id)
    
    def _parse_results_page(self, soup: BeautifulSoup) -> List[HLTVMatchResult]:
        """Parse the results page HTML"""
        matches = []
        
        # Find all result blocks
        result_blocks = soup.find_all("div", class_="result-con")
        
        for block in result_blocks:
            try:
                match = self._parse_result_block(block)
                if match:
                    matches.append(match)
            except Exception as e:
                logger.error("Failed to parse result block", error=str(e))
                continue
        
        logger.info("Parsed results", count=len(matches))
        return matches
    
    def _parse_result_block(self, block) -> Optional[HLTVMatchResult]:
        """Parse a single result block"""
        try:
            # Get match link and ID
            link_elem = block.find("a", class_="a-reset")
            if not link_elem:
                return None
            
            href = link_elem.get("href", "")
            match_id = href.split("/")[-2] if "/matches/" in href else ""
            
            # Get teams
            team_elems = block.find_all("div", class_="team")
            if len(team_elems) < 2:
                return None
            
            team_a = team_elems[0].get_text(strip=True)
            team_b = team_elems[1].get_text(strip=True)
            
            # Get scores
            score_elem = block.find("td", class_="result-score")
            if not score_elem:
                return None
            
            score_text = score_elem.get_text(strip=True)
            if "-" not in score_text:
                return None
            
            score_parts = score_text.split("-")
            score_a = int(score_parts[0].strip())
            score_b = int(score_parts[1].strip())
            
            # Get event info
            event_elem = block.find("span", class_="event-name")
            event_name = event_elem.get_text(strip=True) if event_elem else "Unknown"
            
            # Get map info if available
            map_elem = block.find("div", class_="map-text")
            map_name = map_elem.get_text(strip=True) if map_elem else None
            
            return HLTVMatchResult(
                match_id=match_id,
                team_a=team_a,
                team_b=team_b,
                score_a=score_a,
                score_b=score_b,
                event_name=event_name,
                map_name=map_name,
                url=f"{self.BASE_URL}{href}" if href else None
            )
            
        except Exception as e:
            logger.error("Parse error in result block", error=str(e))
            return None
    
    def _parse_match_details(
        self, 
        soup: BeautifulSoup, 
        match_id: str
    ) -> HLTVMatchDetails:
        """Parse detailed match page"""
        try:
            # Get team names
            team_a_elem = soup.select_one(".team1-gradient .teamName")
            team_b_elem = soup.select_one(".team2-gradient .teamName")
            
            team_a = team_a_elem.get_text(strip=True) if team_a_elem else "TBD"
            team_b = team_b_elem.get_text(strip=True) if team_b_elem else "TBD"
            
            # Get event name
            event_elem = soup.select_one(".event a")
            event_name = (
                event_elem.get_text(strip=True) 
                if event_elem else "Unknown Event"
            )
            
            # Get match format
            format_elem = soup.select_one(".preformatted-text")
            format_str = "bo1"
            if format_elem:
                format_text = format_elem.get_text(strip=True).lower()
                if "bo3" in format_text:
                    format_str = "bo3"
                elif "bo5" in format_text:
                    format_str = "bo5"
            
            # Parse map stats
            maps = self._parse_map_stats(soup, team_a, team_b)
            
            return HLTVMatchDetails(
                match_id=match_id,
                team_a=team_a,
                team_b=team_b,
                event_name=event_name,
                format=format_str,
                maps=maps
            )
            
        except Exception as e:
            logger.error("Failed to parse match details", error=str(e))
            return HLTVMatchDetails(
                match_id=match_id,
                team_a="Unknown",
                team_b="Unknown",
                event_name="Unknown"
            )
    
    def _parse_map_stats(
        self, 
        soup: BeautifulSoup, 
        team_a: str, 
        team_b: str
    ) -> List[HLTVMapStats]:
        """Parse map statistics from match page"""
        maps = []
        
        try:
            # Find all map sections
            map_sections = soup.find_all("div", class_="mapholder")
            
            for section in map_sections:
                try:
                    # Get map name
                    map_name_elem = section.find("div", class_="mapname")
                    if not map_name_elem:
                        continue
                    map_name = map_name_elem.get_text(strip=True)
                    
                    # Get scores for this map
                    score_elems = section.find_all("div", class_="results-team-score")
                    if len(score_elems) >= 2:
                        map_score_a = int(score_elems[0].get_text(strip=True))
                        map_score_b = int(score_elems[1].get_text(strip=True))
                    else:
                        map_score_a = 0
                        map_score_b = 0
                    
                    # Parse player stats table
                    player_stats = self._parse_player_stats_table(
                        section, team_a, team_b
                    )
                    
                    maps.append(HLTVMapStats(
                        map_name=map_name,
                        team_a=team_a,
                        team_b=team_b,
                        score_a=map_score_a,
                        score_b=map_score_b,
                        player_stats=player_stats
                    ))
                    
                except Exception as e:
                    logger.error("Failed to parse map section", error=str(e))
                    continue
            
        except Exception as e:
            logger.error("Failed to parse map stats", error=str(e))
        
        return maps
    
    def _parse_player_stats_table(
        self, 
        section, 
        team_a: str, 
        team_b: str
    ) -> List[HLTVPlayerStats]:
        """Parse player statistics table"""
        player_stats = []
        
        try:
            # Find stats tables
            tables = section.find_all("table", class_="stats-table")
            
            for table in tables:
                rows = table.find_all("tr")[1:]  # Skip header
                
                for row in rows:
                    try:
                        cells = row.find_all("td")
                        if len(cells) < 6:
                            continue
                        
                        # Player name
                        player_elem = cells[0].find("a")
                        player_name = (
                            player_elem.get_text(strip=True) 
                            if player_elem else "Unknown"
                        )
                        player_id = (
                            player_elem.get("href", "").split("/")[-2] 
                            if player_elem else ""
                        )
                        
                        # Determine team
                        team = team_a  # Simplified - would need more logic for actual team
                        
                        # K-D
                        kd_text = cells[1].get_text(strip=True) if len(cells) > 1 else "0-0"
                        kd_parts = kd_text.split("-")
                        kills = int(kd_parts[0]) if kd_parts[0].isdigit() else 0
                        deaths = int(kd_parts[1]) if len(kd_parts) > 1 and kd_parts[1].isdigit() else 0
                        
                        # ADR
                        adr_text = cells[4].get_text(strip=True) if len(cells) > 4 else "0"
                        adr = float(adr_text) if adr_text.replace(".", "").isdigit() else 0.0
                        
                        # KAST
                        kast_text = cells[5].get_text(strip=True) if len(cells) > 5 else "0"
                        kast = float(kast_text.replace("%", "")) if kast_text else 0.0
                        
                        # Rating
                        rating_text = cells[6].get_text(strip=True) if len(cells) > 6 else "0"
                        rating = float(rating_text) if rating_text.replace(".", "").isdigit() else 0.0
                        
                        player_stats.append(HLTVPlayerStats(
                            player_id=player_id,
                            player_name=player_name,
                            team=team,
                            kills=kills,
                            deaths=deaths,
                            adr=adr,
                            kast=kast,
                            rating=rating
                        ))
                        
                    except Exception as e:
                        logger.error("Failed to parse player row", error=str(e))
                        continue
            
        except Exception as e:
            logger.error("Failed to parse stats table", error=str(e))
        
        return player_stats
    
    def _parse_event_matches(
        self, 
        soup: BeautifulSoup, 
        event_id: str
    ) -> List[HLTVMatchResult]:
        """Parse event matches page"""
        matches = []
        
        try:
            # Find match links
            match_links = soup.find_all("a", href=lambda x: x and "/matches/" in x)
            
            for link in match_links:
                try:
                    href = link.get("href", "")
                    match_id = href.split("/")[-2] if "/matches/" in href else ""
                    
                    # Get team names from the link context
                    team_elems = link.find_all("div", class_="team")
                    if len(team_elems) >= 2:
                        team_a = team_elems[0].get_text(strip=True)
                        team_b = team_elems[1].get_text(strip=True)
                    else:
                        continue
                    
                    matches.append(HLTVMatchResult(
                        match_id=match_id,
                        team_a=team_a,
                        team_b=team_b,
                        score_a=0,  # Will be populated from results
                        score_b=0,
                        event_id=event_id,
                        url=f"{self.BASE_URL}{href}"
                    ))
                    
                except Exception as e:
                    logger.error("Failed to parse event match", error=str(e))
                    continue
            
        except Exception as e:
            logger.error("Failed to parse event matches", error=str(e))
        
        return matches


# CLI runner for testing
async def main():
    """Test the HLTV client"""
    async with HLTVClient() as client:
        # Fetch recent results
        logger.info("Fetching recent results...")
        results = await client.fetch_results(offset=0, limit=10)
        
        print(f"\nFound {len(results)} recent matches:")
        for match in results[:5]:
            print(
                f"  [{match.match_id}] {match.team_a} {match.score_a}-{match.score_b} "
                f"{match.team_b} | {match.event_name}"
            )
        
        # Fetch specific match details (if available)
        if results:
            first_match = results[0]
            logger.info(f"\nFetching details for match {first_match.match_id}...")
            
            try:
                details = await client.fetch_match(first_match.match_id)
                print(f"\nMatch Details:")
                print(f"  Teams: {details.team_a} vs {details.team_b}")
                print(f"  Event: {details.event_name}")
                print(f"  Format: {details.format}")
                print(f"  Maps played: {len(details.maps)}")
                
                for map_stats in details.maps:
                    print(
                        f"    {map_stats.map_name}: {map_stats.score_a}-{map_stats.score_b}"
                    )
                    
            except Exception as e:
                logger.error("Failed to fetch match details", error=str(e))


if __name__ == "__main__":
    asyncio.run(main())
