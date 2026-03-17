"""
Player Parser — Extracts structured player data from VLR.gg player profile HTML.
"""
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


@dataclass
class RawPlayerData:
    """Structured player data extracted from VLR.gg."""
    vlr_player_id: str
    name: Optional[str] = None
    real_name: Optional[str] = None
    team: Optional[str] = None
    region: Optional[str] = None
    role: Optional[str] = None  # Duelist, Controller, Initiator, Sentinel, Flex
    
    # Social/Contact
    twitter: Optional[str] = None
    twitch: Optional[str] = None
    
    # Career stats
    total_maps: Optional[int] = None
    total_kills: Optional[int] = None
    total_deaths: Optional[int] = None
    total_assists: Optional[int] = None
    
    # Per-game averages
    acs_avg: Optional[float] = None
    adr_avg: Optional[float] = None
    kast_avg: Optional[float] = None
    rating_avg: Optional[float] = None
    
    # Agent statistics
    agents: list[dict] = field(default_factory=list)
    
    # Recent matches
    recent_matches: list[dict] = field(default_factory=list)
    
    # Metadata
    extraction_date: str = field(default_factory=lambda: datetime.now().isoformat())


class PlayerParser:
    """
    Parses VLR.gg player profile pages into structured RawPlayerData.
    Schema version: v2 (2023+).
    """

    def parse(self, html: str, vlr_player_id: str) -> Optional[RawPlayerData]:
        """
        Parse player HTML. Returns None if HTML does not match expected schema.
        
        Args:
            html: Raw HTML content from VLR.gg
            vlr_player_id: VLR player identifier
            
        Returns:
            RawPlayerData object or None if parsing fails
        """
        if not self._has_expected_structure(html):
            logger.error(
                "Schema validation failed for player %s — possible drift", vlr_player_id
            )
            return None

        soup = BeautifulSoup(html, "lxml")

        return RawPlayerData(
            vlr_player_id=vlr_player_id,
            name=self._extract_name(soup),
            real_name=self._extract_real_name(soup),
            team=self._extract_team(soup),
            region=self._extract_region(soup),
            role=self._extract_role(soup),
            twitter=self._extract_twitter(soup),
            twitch=self._extract_twitch(soup),
            total_maps=self._extract_total_maps(soup),
            total_kills=self._extract_total_kills(soup),
            total_deaths=self._extract_total_deaths(soup),
            total_assists=self._extract_total_assists(soup),
            acs_avg=self._extract_acs_avg(soup),
            adr_avg=self._extract_adr_avg(soup),
            kast_avg=self._extract_kast_avg(soup),
            rating_avg=self._extract_rating_avg(soup),
            agents=self._extract_agents(soup),
            recent_matches=self._extract_recent_matches(soup),
        )

    def _has_expected_structure(self, html: str) -> bool:
        """Basic structural validation — checks for required HTML elements."""
        required_markers = ["player-header", "player-stats", "wf-module"]
        html_lower = html.lower()
        return sum(1 for marker in required_markers if marker in html_lower) >= 2

    def _extract_name(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract player alias/name."""
        # Try multiple selectors for player name
        selectors = [
            '.player-header h1',
            '.player-header h2',
            '.wf-title',
            '[class*="player-name"]',
        ]
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return None

    def _extract_real_name(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract real name if available."""
        # Often shown as subtitle or in info section
        elem = soup.select_one('.player-header .ge-text-light')
        if elem:
            return elem.get_text(strip=True)
        
        # Alternative: look in player info section
        info_section = soup.find(string=re.compile(r'Real\s*Name', re.I))
        if info_section:
            parent = info_section.find_parent(['div', 'span', 'p'])
            if parent:
                # Get next sibling or parent's text
                text = parent.get_text(strip=True)
                if ':' in text:
                    return text.split(':', 1)[1].strip()
        return None

    def _extract_team(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract current team name."""
        team_elem = soup.select_one('.player-header-team, .team-name, [class*="team"] a')
        if team_elem:
            return team_elem.get_text(strip=True)
        return None

    def _extract_region(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract player region."""
        # Region is often shown as a flag or text
        region_elem = soup.select_one('.flag, [class*="region"], [class*="country"]')
        if region_elem:
            # Try data attribute first
            region = region_elem.get('data-country') or region_elem.get('title')
            if region:
                return region
            return region_elem.get_text(strip=True)
        return None

    def _extract_role(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract player role (inferred from agent statistics if not explicit)."""
        # Look for explicit role tag
        role_elem = soup.select_one('.role, [class*="role"]')
        if role_elem:
            role_text = role_elem.get_text(strip=True).upper()
            valid_roles = {'DUELIST', 'CONTROLLER', 'INITIATOR', 'SENTINEL', 'FLEX'}
            for role in valid_roles:
                if role in role_text:
                    return role
        
        # If no explicit role, will be inferred from agent stats later
        return None

    def _extract_social(self, soup: BeautifulSoup, platform: str) -> Optional[str]:
        """Extract social media link for given platform."""
        link = soup.find('a', href=re.compile(rf'{platform}', re.I))
        if link:
            return link.get('href')
        return None

    def _extract_twitter(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract Twitter handle."""
        return self._extract_social(soup, 'twitter\.com')

    def _extract_twitch(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract Twitch channel."""
        return self._extract_social(soup, 'twitch\.tv')

    def _parse_stat_value(self, text: str) -> Optional[int]:
        """Parse numeric value from stat text, handling K/M suffixes."""
        if not text:
            return None
        text = text.strip().replace(',', '')
        try:
            if text.endswith('K'):
                return int(float(text[:-1]) * 1000)
            elif text.endswith('M'):
                return int(float(text[:-1]) * 1000000)
            else:
                return int(float(text))
        except (ValueError, TypeError):
            return None

    def _parse_float_value(self, text: str) -> Optional[float]:
        """Parse float value from stat text."""
        if not text:
            return None
        text = text.strip().replace(',', '')
        try:
            # Handle percentage
            if text.endswith('%'):
                return float(text[:-1])
            return float(text)
        except (ValueError, TypeError):
            return None

    def _extract_total_maps(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract total maps played."""
        elem = soup.find(string=re.compile(r'Maps', re.I))
        if elem:
            parent = elem.find_parent(['div', 'span', 'td'])
            if parent:
                value_elem = parent.find_next_sibling() or parent.find_next('span')
                if value_elem:
                    return self._parse_stat_value(value_elem.get_text())
        return None

    def _extract_total_kills(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract total kills."""
        return self._extract_stat_by_label(soup, r'Kills')

    def _extract_total_deaths(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract total deaths."""
        return self._extract_stat_by_label(soup, r'Deaths')

    def _extract_total_assists(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract total assists."""
        return self._extract_stat_by_label(soup, r'Assists')

    def _extract_stat_by_label(self, soup: BeautifulSoup, label_pattern: str) -> Optional[int]:
        """Generic method to extract stat by label pattern."""
        elem = soup.find(string=re.compile(label_pattern, re.I))
        if elem:
            parent = elem.find_parent(['div', 'td', 'th'])
            if parent:
                # Look for value in same or next cell
                value_elem = parent.find_next_sibling()
                if value_elem:
                    return self._parse_stat_value(value_elem.get_text())
                # Try finding number in parent's text
                text = parent.get_text(strip=True)
                numbers = re.findall(r'\d+,?\d*', text)
                if numbers:
                    return self._parse_stat_value(numbers[-1])
        return None

    def _extract_acs_avg(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract average combat score."""
        return self._extract_float_stat_by_label(soup, r'ACS|Combat\s*Score')

    def _extract_adr_avg(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract average damage per round."""
        return self._extract_float_stat_by_label(soup, r'ADR|Damage\s*per\s*Round')

    def _extract_kast_avg(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract KAST percentage."""
        return self._extract_float_stat_by_label(soup, r'KAST')

    def _extract_rating_avg(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract average rating."""
        return self._extract_float_stat_by_label(soup, r'Rating')

    def _extract_float_stat_by_label(self, soup: BeautifulSoup, label_pattern: str) -> Optional[float]:
        """Generic method to extract float stat by label pattern."""
        elem = soup.find(string=re.compile(label_pattern, re.I))
        if elem:
            parent = elem.find_parent(['div', 'td', 'th'])
            if parent:
                value_elem = parent.find_next_sibling()
                if value_elem:
                    return self._parse_float_value(value_elem.get_text())
                text = parent.get_text(strip=True)
                # Extract number from text
                numbers = re.findall(r'\d+\.?\d*', text)
                if numbers:
                    return self._parse_float_value(numbers[-1])
        return None

    def _extract_agents(self, soup: BeautifulSoup) -> list[dict]:
        """Extract agent statistics."""
        agents = []
        
        # Find agent stats table or section
        agent_sections = soup.select('.agent-stats, .mod-agents, [class*="agent"]')
        
        for section in agent_sections:
            agent_name = None
            
            # Try to find agent name
            name_elem = section.select_one('.agent-name, img[alt]')
            if name_elem:
                agent_name = name_elem.get('alt') or name_elem.get_text(strip=True)
            
            if not agent_name:
                continue
                
            agent_data = {
                'agent': agent_name,
                'playtime_pct': None,
                'rounds': None,
                'rating': None,
                'acs': None,
                'kd': None,
                'adr': None,
            }
            
            # Extract stats from table cells
            stats = section.select('.mod-stat, td')
            for i, stat in enumerate(stats):
                text = stat.get_text(strip=True)
                value = self._parse_float_value(text)
                
                # Map based on position or content
                if i == 0 and value:
                    agent_data['playtime_pct'] = value
                elif 'rating' in text.lower() and value:
                    agent_data['rating'] = value
                elif 'acs' in text.lower() and value:
                    agent_data['acs'] = value
                elif 'kd' in text.lower() or 'k/d' in text.lower():
                    if value:
                        agent_data['kd'] = value
                elif 'adr' in text.lower() and value:
                    agent_data['adr'] = value
            
            agents.append(agent_data)
        
        return agents

    def _extract_recent_matches(self, soup: BeautifulSoup) -> list[dict]:
        """Extract recent match results."""
        matches = []
        
        # Find match history table
        match_rows = soup.select('.match-item, .mod-match, tr[class*="match"]')
        
        for row in match_rows[:10]:  # Last 10 matches
            match_data = {
                'date': None,
                'tournament': None,
                'opponent': None,
                'map': None,
                'result': None,  # 'W' or 'L'
                'score': None,
                'agent': None,
                'kills': None,
                'deaths': None,
                'assists': None,
                'rating': None,
            }
            
            # Extract date
            date_elem = row.select_one('.date, [class*="date"]')
            if date_elem:
                match_data['date'] = date_elem.get_text(strip=True)
            
            # Extract tournament
            tourney_elem = row.select_one('.tournament, [class*="event"]')
            if tourney_elem:
                match_data['tournament'] = tourney_elem.get_text(strip=True)
            
            # Extract opponent
            opponent_elem = row.select_one('.opponent, [class*="opponent"]')
            if opponent_elem:
                match_data['opponent'] = opponent_elem.get_text(strip=True)
            
            # Extract result (W/L)
            result_elem = row.select_one('.result, [class*="result"]')
            if result_elem:
                result_text = result_elem.get_text(strip=True).upper()
                if 'W' in result_text or 'WIN' in result_text:
                    match_data['result'] = 'W'
                elif 'L' in result_text or 'LOSS' in result_text:
                    match_data['result'] = 'L'
            
            # Extract score
            score_elem = row.select_one('.score, [class*="score"]')
            if score_elem:
                match_data['score'] = score_elem.get_text(strip=True)
            
            # Extract stats
            stats = row.select('.mod-stat, td')
            for i, stat in enumerate(stats):
                text = stat.get_text(strip=True)
                value = self._parse_float_value(text)
                
                if i == 0:
                    match_data['agent'] = text
                elif value and match_data['kills'] is None:
                    match_data['kills'] = int(value) if value == int(value) else value
                elif value and match_data['deaths'] is None:
                    match_data['deaths'] = int(value) if value == int(value) else value
                elif value and match_data['assists'] is None:
                    match_data['assists'] = int(value) if value == int(value) else value
                elif value and match_data['rating'] is None:
                    match_data['rating'] = value
            
            matches.append(match_data)
        
        return matches
