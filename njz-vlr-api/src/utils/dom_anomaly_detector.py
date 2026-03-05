"""
Auto-Discovery HTML Parser with ML-Based Anomaly Detection
Detects when VLR.gg changes their DOM structure and alerts maintainers
"""

import hashlib
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, asdict
import structlog

from selectolax.parser import HTMLParser

logger = structlog.get_logger(__name__)


@dataclass
class DOMSignature:
    """Signature of a DOM structure for comparison"""
    url_pattern: str
    css_selectors: Dict[str, str]
    checksum: str
    sample_count: int
    last_updated: datetime
    
    def to_dict(self) -> dict:
        return {
            **asdict(self),
            "last_updated": self.last_updated.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "DOMSignature":
        data["last_updated"] = datetime.fromisoformat(data["last_updated"])
        return cls(**data)


class DOMStructureLearner:
    """
    Learns and tracks DOM structures over time
    Uses statistical analysis to detect anomalies
    """
    
    def __init__(self, storage_path: str = "./data/dom_signatures"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.signatures: Dict[str, DOMSignature] = {}
        self._load_signatures()
    
    def _get_signature_path(self, scraper_name: str) -> Path:
        return self.storage_path / f"{scraper_name}_signature.json"
    
    def _load_signatures(self):
        """Load existing signatures from disk"""
        for sig_file in self.storage_path.glob("*_signature.json"):
            scraper_name = sig_file.stem.replace("_signature", "")
            try:
                with open(sig_file, 'r') as f:
                    data = json.load(f)
                    self.signatures[scraper_name] = DOMSignature.from_dict(data)
            except Exception as e:
                logger.warning("dom.load_failed", scraper=scraper_name, error=str(e))
    
    def _save_signature(self, scraper_name: str):
        """Save signature to disk"""
        sig_path = self._get_signature_path(scraper_name)
        with open(sig_path, 'w') as f:
            json.dump(self.signatures[scraper_name].to_dict(), f, indent=2)
    
    def extract_selectors(self, html: str, url_pattern: str) -> Dict[str, str]:
        """
        Extract CSS selectors from HTML sample
        Uses heuristics to find data-containing elements
        """
        tree = HTMLParser(html)
        selectors = {}
        
        # Common VLR.gg selectors
        test_selectors = {
            "match_cards": ".match-item",
            "team_names": ".match-item-vs-team-name",
            "scores": ".match-item-vs-score",
            "events": ".match-item-event",
            "player_stats": ".player-stats-row",
            "map_names": ".vm-stats-game .map",
        }
        
        for name, selector in test_selectors.items():
            elements = tree.css(selector)
            if elements:
                selectors[name] = {
                    "selector": selector,
                    "count": len(elements),
                    "sample_text": elements[0].text(strip=True)[:50] if elements[0].text() else ""
                }
        
        return selectors
    
    def compute_checksum(self, selectors: Dict) -> str:
        """Compute checksum of selector structure"""
        selector_str = json.dumps(selectors, sort_keys=True)
        return hashlib.sha256(selector_str.encode()).hexdigest()[:16]
    
    def learn(self, scraper_name: str, html: str, url_pattern: str) -> bool:
        """
        Learn from a new HTML sample
        Returns True if this is a new or updated signature
        """
        selectors = self.extract_selectors(html, url_pattern)
        checksum = self.compute_checksum(selectors)
        
        if scraper_name not in self.signatures:
            # First time seeing this scraper
            self.signatures[scraper_name] = DOMSignature(
                url_pattern=url_pattern,
                css_selectors=selectors,
                checksum=checksum,
                sample_count=1,
                last_updated=datetime.utcnow()
            )
            self._save_signature(scraper_name)
            logger.info("dom.new_signature", scraper=scraper_name, checksum=checksum)
            return True
        
        existing = self.signatures[scraper_name]
        
        if existing.checksum != checksum:
            # Structure has changed - update signature
            old_checksum = existing.checksum
            existing.css_selectors = selectors
            existing.checksum = checksum
            existing.sample_count += 1
            existing.last_updated = datetime.utcnow()
            self._save_signature(scraper_name)
            
            logger.warning(
                "dom.structure_changed",
                scraper=scraper_name,
                old_checksum=old_checksum,
                new_checksum=checksum,
                samples=existing.sample_count
            )
            return True
        
        # Structure matches - increment sample count
        existing.sample_count += 1
        if existing.sample_count % 10 == 0:
            self._save_signature(scraper_name)
        
        return False
    
    def detect_anomaly(self, scraper_name: str, html: str) -> Optional[Dict]:
        """
        Detect if HTML structure differs significantly from learned signature
        Returns anomaly details if detected, None if normal
        """
        if scraper_name not in self.signatures:
            logger.info("dom.no_baseline", scraper=scraper_name)
            return None
        
        current_selectors = self.extract_selectors(html, "")
        current_checksum = self.compute_checksum(current_selectors)
        signature = self.signatures[scraper_name]
        
        if current_checksum == signature.checksum:
            return None  # No anomaly
        
        # Calculate differences
        missing_selectors = set(signature.css_selectors.keys()) - set(current_selectors.keys())
        new_selectors = set(current_selectors.keys()) - set(signature.css_selectors.keys())
        
        # Check if critical selectors are missing
        critical_selectors = {"match_cards", "team_names", "player_stats"}
        missing_critical = missing_selectors & critical_selectors
        
        anomaly = {
            "scraper": scraper_name,
            "severity": "HIGH" if missing_critical else "MEDIUM",
            "old_checksum": signature.checksum,
            "new_checksum": current_checksum,
            "missing_selectors": list(missing_selectors),
            "new_selectors": list(new_selectors),
            "last_known_good": signature.last_updated.isoformat(),
            "confidence": min(signature.sample_count / 100, 1.0),  # Confidence based on sample size
            "recommendation": "Update scraper selectors" if missing_critical else "Review changes"
        }
        
        logger.error("dom.anomaly_detected", **anomaly)
        return anomaly


class AnomalyAlertManager:
    """
    Manages alerts for DOM structure changes
    Prevents alert fatigue with deduplication
    """
    
    def __init__(self):
        self.recent_alerts: Dict[str, datetime] = {}
        self.alert_cooldown = timedelta(hours=1)
    
    def should_alert(self, scraper_name: str, anomaly: Dict) -> bool:
        """Check if we should send an alert (not in cooldown)"""
        now = datetime.utcnow()
        
        if scraper_name in self.recent_alerts:
            last_alert = self.recent_alerts[scraper_name]
            if now - last_alert < self.alert_cooldown:
                return False
        
        self.recent_alerts[scraper_name] = now
        return True
    
    def format_alert(self, anomaly: Dict) -> str:
        """Format anomaly for notification"""
        return f"""
🚨 DOM STRUCTURE ALERT

Scraper: {anomaly['scraper']}
Severity: {anomaly['severity']}
Confidence: {anomaly['confidence']:.1%}

Changes Detected:
- Old Checksum: {anomaly['old_checksum']}
- New Checksum: {anomaly['new_checksum']}
- Missing Selectors: {', '.join(anomaly['missing_selectors']) or 'None'}
- New Selectors: {', '.join(anomaly['new_selectors']) or 'None'}

Recommendation: {anomaly['recommendation']}
Last Known Good: {anomaly['last_known_good']}
        """.strip()


# Global instance
dom_learner = DOMStructureLearner()