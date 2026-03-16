"""
Team Parser — Extracts structured team data from VLR.gg team profile HTML.
"""
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


@dataclass
class RawTeamData:
    """Structured team data extracted from VLR.gg."""
    vlr_team_id: str
    name: Optional[str] = None
    tag: Optional[str] = None  # Short tag like "SEN", "FNC"
    region: Optional[str] = None
    
    # Social/Links
    twitter: Optional[str] = None
    website: Optional[str] = None
    
    # Roster
    current_roster: list[dict] = field(default_factory=list)
    
    # Recent performance
    recent_matches: list[dict] = field(default_factory=list)
    
    # Tournament results
    tournament_results: list[dict] = field(default_factory=list)
    
    # Team stats
    maps_played: Optional[int] = None
    wins: Optional[int] = None
    losses: Optional[int] = None
    win_rate: Optional[float] = None
    
    # Average team stats
    avg_kd: Optional[float] = None
    avg_rating: Optional[float] = None
    
    # Metadata
    extraction_date: str = field(default_factory=lambda: datetime.now().isoformat())


class TeamParser:
    """
    Parses VLR.gg team profile pages into structured RawTeamData.
    Schema version: v2 (2023+).
    """

    def parse(self, html: str, vlr_team_id: str) -> Optional[RawTeamData]:
        """
        Parse team HTML. Returns None if HTML does not match expected schema.
        
        Args:
            html: Raw HTML content from VLR.gg
            vlr_team_id: VLR team identifier
            
        Returns:
            RawTeamData object or None if parsing fails
        """
        if not self._has_expected_structure(html):
            logger.error(
                "Schema validation failed for team %s — possible drift", vlr_team_id
            )
            return None

        soup = BeautifulSoup(html, "lxml")

        return RawTeamData(
            vlr_team_id=vlr_team_id,
            name=self._extract_name(soup),
            tag=self._extract_tag(soup),
            region=self._extract_region(soup),
            twitter=self._extract_twitter(soup),
            website=self._extract_website(soup),
            current_roster=self._extract_roster(soup),
            recent_matches=self._extract_recent_matches(soup),
            tournament_results=self._extract_tournament_results(soup),
            maps_played=self._extract_maps_played(soup),
            wins=self._extract_wins(soup),
            losses=self._extract_losses(soup),
            win_rate=self._extract_win_rate(soup),
            avg_kd=self._extract_avg_kd(soup),
            avg_rating=self._extract_avg_rating(soup),
        )

    def _has_expected_structure(self, html: str) -> bool:
        """Basic structural validation — checks for required HTML elements."""
        required_markers = ["team-header", "team-stats", "wf-module", "roster"]
        html_lower = html.lower()
        return sum(1 for marker in required_markers if marker in html_lower) >= 2

    def _extract_name(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract team name."""
        selectors = [
            '.team-header h1',
            '.team-header h2',
            '.wf-title',
            '[class*="team-name"]',
            'h1',
        ]
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                name = elem.get_text(strip=True)
                # Remove tag suffix if present (e.g., "Sentinels (SEN)")
                return re.sub(r'\s*\([^)]+\)\s*$', '', name)
        return None

    def _extract_tag(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract team tag/abbreviation."""
        # Often shown in parentheses after name or in header
        name_elem = soup.select_one('.team-header h1, .team-header h2, h1')
        if name_elem:
            text = name_elem.get_text(strip=True)
            # Look for pattern: "Name (TAG)"
            match = re.search(r'\(([A-Z0-9]{2,5})\)$', text)
            if match:
                return match.group(1)
        
        # Alternative: look for tag element
        tag_elem = soup.select_one('.team-tag, [class*="tag"]')
        if tag_elem:
            return tag_elem.get_text(strip=True)
        return None

    def _extract_region(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract team region."""
        region_elem = soup.select_one('.flag, [class*="region"], [class*="country"]')
        if region_elem:
            region = region_elem.get('data-country') or region_elem.get('title')
            if region:
                return region
            return region_elem.get_text(strip=True)
        
        # Try to find in team info
        info_elem = soup.find(string=re.compile(r'Region', re.I))
        if info_elem:
            parent = info_elem.find_parent(['div', 'span', 'p'])
            if parent:
                text = parent.get_text(strip=True)
                if ':' in text:
                    return text.split(':', 1)[1].strip()
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

    def _extract_website(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract official website."""
        # Look for external website link (not VLR, not Twitter/Twitch)
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            if (
                href.startswith('http') and
                'vlr.gg' not in href and
                'twitter.com' not in href and
                'twitch.tv' not in href
            ):
                return href
        return None

    def _extract_roster(self, soup: BeautifulSoup) -> list[dict]:
        """Extract current team roster."""
        roster = []
        
        # Find roster section
        roster_section = soup.select_one('.roster, [class*="roster"], .team-roster')
        if not roster_section:
            # Try finding by player cards
            player_cards = soup.select('.player-card, [class*="team-member"]')
        else:
            player_cards = roster_section.select('.player-card, .member, tr')
        
        for card in player_cards:
            player_data = {
                'name': None,
                'vlr_player_id': None,
                'role': None,
                'join_date': None,
                'country': None,
            }
            
            # Extract name
            name_elem = card.select_one('.player-name, .name, a[href*="/player/"]')
            if name_elem:
                player_data['name'] = name_elem.get_text(strip=True)
                
                # Extract player ID from link
                href = name_elem.get('href', '')
                if '/player/' in href:
                    match = re.search(r'/player/(\d+)', href)
                    if match:
                        player_data['vlr_player_id'] = match.group(1)
            
            # Extract role
            role_elem = card.select_one('.role, [class*="role"]')
            if role_elem:
                role_text = role_elem.get_text(strip=True).upper()
                valid_roles = {'DUELIST', 'CONTROLLER', 'INITIATOR', 'SENTINEL', 'FLEX', 'IGL'}
                for role in valid_roles:
                    if role in role_text:
                        player_data['role'] = role
                        break
            
            # Extract country/region
            flag_elem = card.select_one('.flag, [class*="country"]')
            if flag_elem:
                country = flag_elem.get('data-country') or flag_elem.get('title')
                if country:
                    player_data['country'] = country
            
            # Extract join date
            date_elem = card.select_one('.date, [class*="join"]')
            if date_elem:
                player_data['join_date'] = date_elem.get_text(strip=True)
            
            if player_data['name']:
                roster.append(player_data)
        
        return roster

    def _extract_recent_matches(self, soup: BeautifulSoup) -> list[dict]:
        """Extract recent match results."""
        matches = []
        
        match_rows = soup.select('.match-item, .mod-match, tr[class*="match"]')
        
        for row in match_rows[:10]:  # Last 10 matches
            match_data = {
                'date': None,
                'tournament': None,
                'opponent': None,
                'opponent_id': None,
                'result': None,
                'score': None,
                'map_scores': [],
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
            opponent_elem = row.select_one('.opponent, [class*="opponent"] a')
            if opponent_elem:
                match_data['opponent'] = opponent_elem.get_text(strip=True)
                href = opponent_elem.get('href', '')
                if '/team/' in href:
                    match = re.search(r'/team/(\d+)', href)
                    if match:
                        match_data['opponent_id'] = match.group(1)
            
            # Extract result
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
            
            # Extract map scores if available
            map_scores = row.select('.map-score, [class*="map"]')
            for map_elem in map_scores:
                text = map_elem.get_text(strip=True)
                if text:
                    match_data['map_scores'].append(text)
            
            matches.append(match_data)
        
        return matches

    def _extract_tournament_results(self, soup: BeautifulSoup) -> list[dict]:
        """Extract tournament placement history."""
        results = []
        
        # Find tournament results table/section
        tourney_rows = soup.select('.tournament-result, .event-result, tr[class*="tournament"]')
        
        for row in tourney_rows[:20]:  # Last 20 tournaments
            result_data = {
                'tournament': None,
                'date': None,
                'placement': None,
                'prize': None,
            }
            
            # Extract tournament name
            name_elem = row.select_one('.tournament-name, .event-name, a')
            if name_elem:
                result_data['tournament'] = name_elem.get_text(strip=True)
            
            # Extract date
            date_elem = row.select_one('.date, [class*="date"]')
            if date_elem:
                result_data['date'] = date_elem.get_text(strip=True)
            
            # Extract placement
            placement_elem = row.select_one('.placement, .rank, [class*="place"]')
            if placement_elem:
                text = placement_elem.get_text(strip=True)
                # Parse "1st", "2nd", "3-4th", etc.
                result_data['placement'] = text
            
            # Extract prize
            prize_elem = row.select_one('.prize, [class*="prize"]')
            if prize_elem:
                result_data['prize'] = prize_elem.get_text(strip=True)
            
            if result_data['tournament']:
                results.append(result_data)
        
        return results

    def _parse_stat_value(self, text: str) -> Optional[int]:
        """Parse numeric value from stat text."""
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
        text = text.strip().replace('%', '').replace(',', '')
        try:
            return float(text)
        except (ValueError, TypeError):
            return None

    def _extract_maps_played(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract total maps played."""
        return self._extract_stat_by_label(soup, r'Maps\s*Played|Total\s*Maps')

    def _extract_wins(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract total wins."""
        return self._extract_stat_by_label(soup, r'Wins?')

    def _extract_losses(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract total losses."""
        return self._extract_stat_by_label(soup, r'Loss(?:es)?')

    def _extract_win_rate(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract win rate percentage."""
        return self._extract_float_stat_by_label(soup, r'Win\s*(?:Rate|%|Percentage)')

    def _extract_avg_kd(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract average K/D ratio."""
        return self._extract_float_stat_by_label(soup, r'K/D|KD\s*Ratio')

    def _extract_avg_rating(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract average team rating."""
        return self._extract_float_stat_by_label(soup, r'Rating')

    def _extract_stat_by_label(self, soup: BeautifulSoup, label_pattern: str) -> Optional[int]:
        """Generic method to extract stat by label pattern."""
        elem = soup.find(string=re.compile(label_pattern, re.I))
        if elem:
            parent = elem.find_parent(['div', 'td', 'th', 'span'])
            if parent:
                value_elem = parent.find_next_sibling()
                if value_elem:
                    return self._parse_stat_value(value_elem.get_text())
                text = parent.get_text(strip=True)
                numbers = re.findall(r'\d+,?\d*', text)
                if numbers:
                    return self._parse_stat_value(numbers[-1])
        return None

    def _extract_float_stat_by_label(self, soup: BeautifulSoup, label_pattern: str) -> Optional[float]:
        """Generic method to extract float stat by label pattern."""
        elem = soup.find(string=re.compile(label_pattern, re.I))
        if elem:
            parent = elem.find_parent(['div', 'td', 'th', 'span'])
            if parent:
                value_elem = parent.find_next_sibling()
                if value_elem:
                    return self._parse_float_value(value_elem.get_text())
                text = parent.get_text(strip=True)
                numbers = re.findall(r'\d+\.?\d*', text)
                if numbers:
                    return self._parse_float_value(numbers[-1])
        return None
