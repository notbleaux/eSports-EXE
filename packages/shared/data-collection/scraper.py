"""VLR.gg Async Scraper
Rate limited, respectful scraping
"""

import asyncio
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential
from pydantic import BaseModel

logger = structlog.get_logger()


class MatchData(BaseModel):
    match_id: str
    team_a: str
    team_b: str
    score_a: int
    score_b: int
    event_id: str
    timestamp: str


class VLRScraper:
    def __init__(self, base_url: str = "https://www.vlr.gg"):
        self.base_url = base_url
        self.semaphore = asyncio.Semaphore(5)  # 5 concurrent
        self.session = None

    async def __aenter__(self):
        connector = aiohttp.TCPConnector(limit=50, limit_per_host=5)
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; Libre-X-Bot/1.0; +https://libre-x.esports)"
            },
        )
        return self

    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()

    @retry(
        stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def scrape_event_matches(self, event_id: str) -> List[MatchData]:
        """Scrape match results from VLR event"""
        async with self.semaphore:
            url = f"{self.base_url}/event/matches/{event_id}"

            async with self.session.get(url) as resp:
                if resp.status == 429:
                    logger.warning("Rate limited, waiting...", event_id=event_id)
                    raise Exception("Rate limited")

                soup = BeautifulSoup(await resp.text(), "lxml")
                matches = []

                for match_card in soup.select("a.wf-module-item"):
                    try:
                        match_data = self._parse_match_card(match_card)
                        if match_data:
                            matches.append(match_data)
                    except Exception as e:
                        logger.error("Parse error", error=str(e))

                logger.info("Scraped matches", count=len(matches), event_id=event_id)
                return matches

    def _parse_match_card(self, card) -> Optional[MatchData]:
        try:
            href = card.get("href", "")
            if not href or "match" not in href:
                return None

            team_a_elem = card.select_one(".match-item-vs-team1")
            team_b_elem = card.select_one(".match-item-vs-team2")
            score_a_elem = card.select_one(".match-item-vs-team1-score")
            score_b_elem = card.select_one(".match-item-vs-team2-score")

            return MatchData(
                match_id=href.split("/")[-1],
                team_a=team_a_elem.text.strip() if team_a_elem else "Unknown",
                team_b=team_b_elem.text.strip() if team_b_elem else "Unknown",
                score_a=(
                    int(score_a_elem.text)
                    if score_a_elem and score_a_elem.text.isdigit()
                    else 0
                ),
                score_b=(
                    int(score_b_elem.text)
                    if score_b_elem and score_b_elem.text.isdigit()
                    else 0
                ),
                event_id="",
                timestamp="",
            )
        except:
            return None


# CLI runner
async def main():
    async with VLRScraper() as scraper:
        matches = await scraper.scrape_event_matches("2183")  # VCT 2024
        print(f"Found {len(matches)} matches")
        for m in matches[:3]:
            print(f"  {m.team_a} {m.score_a}-{m.score_b} {m.team_b}")


if __name__ == "__main__":
    asyncio.run(main())
