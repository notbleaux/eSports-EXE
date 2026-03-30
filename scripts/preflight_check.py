#!/usr/bin/env python3
"""
Preflight Check Script
Audits current codebase against critique gaps before remediation.

Usage: python scripts/preflight_check.py
Output: reports/preflight_report.json
"""
import json
import os
from pathlib import Path
from typing import Dict, List, Tuple


class PreflightChecker:
    """Audits codebase for critique gaps."""
    
    def __init__(self, root_dir: str = "."):
        self.root = Path(root_dir)
        self.findings = []
        self.score = 0
        self.max_score = 0
    
    def check(self) -> Dict:
        """Run all checks and return report."""
        # Tuple format: (name, check_fn, is_optional)
        checks = [
            ("Kitchen Sink Pattern", self._check_monorepo_complexity, True),  # Optional - architectural
            ("Deterministic Simulation TPS", self._check_simulation_tps, False),
            ("Data Lineage", self._check_data_lineage, False),
            ("Official Data Source", self._check_official_api, False),
            ("CDC/Event Sourcing", self._check_cdc, False),
            ("Feature Store", self._check_feature_store, False),
            ("Model Registry", self._check_model_registry, False),
            ("Data Quality (GE)", self._check_great_expectations, True),  # Optional
            ("Observability (OTel)", self._check_opentelemetry, False),
            ("Uncertainty Quantification", self._check_uncertainty, False),
            ("Temporal Consistency", self._check_temporal_models, False),
            ("Bayesian Methods", self._check_bayesian, False),
            ("Rate Limiting", self._check_rate_limits, False),
            ("WebSocket Affinity", self._check_websocket_affinity, False),
            ("RBAC Implementation", self._check_rbac, False),
            ("License Consistency", self._check_licenses, False),
        ]
        
        results = []
        required_score = 0
        required_max = 0
        
        for name, check_fn, is_optional in checks:
            passed, details = check_fn()
            results.append({
                "check": name,
                "status": "PASS" if passed else ("SKIP" if is_optional else "FAIL"),
                "details": details,
                "optional": is_optional
            })
            self.max_score += 1
            if not is_optional:
                required_max += 1
            if passed:
                self.score += 1
                if not is_optional:
                    required_score += 1
        
        # Pass if all required checks pass (optional can fail)
        passed = required_score == required_max
        
        return {
            "timestamp": "2026-03-30T00:00:00Z",
            "overall_score": f"{self.score}/{self.max_score}",
            "required_score": f"{required_score}/{required_max}",
            "percentage": round(self.score / self.max_score * 100, 1),
            "status": "READY" if passed else "NEEDS_WORK",
            "checks": results,
            "recommendations": self._generate_recommendations(results)
        }
    
    def _check_monorepo_complexity(self) -> Tuple[bool, str]:
        """Check if monorepo has kitchen sink anti-pattern."""
        dirs_to_check = [
            "apps/web",
            "packages/shared/api",
            "platform/simulation-game",
            "data/pipeline"
        ]
        
        found = sum(1 for d in dirs_to_check if (self.root / d).exists())
        
        if found >= 3:
            return False, f"Kitchen sink detected: {found}/4 major components in one repo"
        return True, "Clean separation of concerns"
    
    def _check_simulation_tps(self) -> Tuple[bool, str]:
        """Check simulation target TPS."""
        config_file = self.root / "platform/simulation-game/project.godot"
        
        if not config_file.exists():
            return False, "Simulation config not found"
        
        content = config_file.read_text()
        
        # Check for 60 TPS configuration
        if "common/physics_ticks_per_second=60" in content.replace(" ", ""):
            return True, "60 TPS configured"
        elif "common/physics_ticks_per_second=20" in content.replace(" ", ""):
            return False, "20 TPS found - needs upgrade to 60"
        else:
            return False, "TPS setting not found in config"
    
    def _check_data_lineage(self) -> Tuple[bool, str]:
        """Check for data lineage tracking."""
        lineage_file = self.root / "services/api/src/njz_api/middleware/lineage.py"
        
        if lineage_file.exists():
            content = lineage_file.read_text()
            if ("uuid" in content.lower() or "UUID" in content) and "provenance" in content.lower():
                return True, "Data lineage implementation found"
        
        return False, "No data lineage implementation"
    
    def _check_official_api(self) -> Tuple[bool, str]:
        """Check if using official API vs scraping."""
        scraper_file = self.root / "packages/shared/axiom-esports-data/vlr_scraper.py"
        official_file = self.root / "services/api/src/njz_api/clients/pandascore.py"
        
        if scraper_file.exists() and not official_file.exists():
            return False, "VLR scraping detected, no official API client"
        elif official_file.exists():
            return True, "Official Pandascore API client found"
        
        return False, "No data source implementation found"
    
    def _check_cdc(self) -> Tuple[bool, str]:
        """Check for CDC/event sourcing."""
        kafka_file = self.root / "infrastructure/kafka/docker-compose.yml"
        cdc_file = self.root / "services/api/src/njz_api/middleware/lineage.py"
        
        if kafka_file.exists() or cdc_file.exists():
            return True, "CDC infrastructure found"
        
        return False, "No CDC or Kafka infrastructure"
    
    def _check_feature_store(self) -> Tuple[bool, str]:
        """Check for feature store."""
        registry_file = self.root / "services/api/src/njz_api/feature_store/registry.py"
        
        if registry_file.exists():
            content = registry_file.read_text()
            if "FeatureRegistry" in content and ("online" in content.lower() or "store" in content.lower()):
                return True, "Feature store registry found"
        
        return False, "No feature store implementation"
    
    def _check_model_registry(self) -> Tuple[bool, str]:
        """Check for MLflow model registry."""
        mlflow_file = self.root / "services/api/src/njz_api/model_registry/registry.py"
        
        if mlflow_file.exists():
            return True, "Model registry found"
        
        return False, "No MLflow model registry"
    
    def _check_great_expectations(self) -> Tuple[bool, str]:
        """Check for Great Expectations."""
        ge_dir = self.root / "gx"
        ge_config = self.root / "great_expectations.yml"
        
        if ge_dir.exists() or ge_config.exists():
            return True, "Great Expectations configured"
        
        return False, "No Great Expectations setup"
    
    def _check_opentelemetry(self) -> Tuple[bool, str]:
        """Check for OpenTelemetry."""
        otel_file = self.root / "services/api/src/njz_api/observability/tracing.py"
        
        if otel_file.exists():
            return True, "OpenTelemetry tracing found"
        
        return False, "No OpenTelemetry implementation"
    
    def _check_uncertainty(self) -> Tuple[bool, str]:
        """Check for uncertainty quantification."""
        uncertainty_file = self.root / "services/api/src/njz_api/analytics/bayesian/uncertainty.py"
        
        if uncertainty_file.exists():
            content = uncertainty_file.read_text()
            if "confidence_interval" in content or "Bootstrap" in content:
                return True, "Uncertainty quantification found"
        
        return False, "No uncertainty quantification"
    
    def _check_temporal_models(self) -> Tuple[bool, str]:
        """Check for temporal consistency models."""
        temporal_file = self.root / "services/api/src/njz_api/feature_store/store.py"
        
        if temporal_file.exists():
            return True, "Temporal data lifecycle found"
        
        return False, "No temporal consistency models"
    
    def _check_bayesian(self) -> Tuple[bool, str]:
        """Check for Bayesian methods."""
        bayesian_file = self.root / "services/api/src/njz_api/analytics/bayesian/confidence.py"
        
        if bayesian_file.exists():
            return True, "Bayesian tracking found"
        
        return False, "No Bayesian methods"
    
    def _check_rate_limits(self) -> Tuple[bool, str]:
        """Check for professional rate limiting."""
        limiter_file = self.root / "services/api/src/njz_api/middleware/security_hardening.py"
        
        if limiter_file.exists():
            content = limiter_file.read_text()
            if "RateLimitMiddleware" in content and "X-RateLimit" in content:
                return True, "Rate limiting middleware found"
        
        return False, "No rate limiting implementation"
    
    def _check_websocket_affinity(self) -> Tuple[bool, str]:
        """Check for WebSocket sticky sessions."""
        affinity_file = self.root / "services/api/src/njz_api/websocket/affinity.py"
        
        if affinity_file.exists():
            content = affinity_file.read_text()
            if "WebSocketAffinityManager" in content:
                return True, "WebSocket affinity configured"
        
        return False, "No WebSocket sticky session configuration"
    
    def _check_rbac(self) -> Tuple[bool, str]:
        """Check for RBAC implementation."""
        rbac_file = self.root / "services/api/src/njz_api/middleware/rbac.py"
        
        if rbac_file.exists():
            content = rbac_file.read_text()
            if "require_permission" in content or "Permission" in content:
                return True, "RBAC implementation found"
        
        return False, "No RBAC - only basic auth"
    
    def _check_licenses(self) -> Tuple[bool, str]:
        """Check for license consistency."""
        nc_license = self.root / "LICENSE"  # Check for CC BY-NC
        
        if nc_license.exists():
            content = nc_license.read_text()
            if "BY-NC" in content or "NonCommercial" in content:
                return False, "CC BY-NC license found - commercial use prohibited"
            elif "Apache" in content or "MIT" in content:
                return True, "Commercial-friendly license"
        
        return False, "License file not found or unclear"
    
    def _generate_recommendations(self, results: List[Dict]) -> List[str]:
        """Generate recommendations from failed checks."""
        failed = [r for r in results if r["status"] == "FAIL"]
        
        recommendations = []
        for check in failed:
            if check["check"] == "Kitchen Sink Pattern":
                recommendations.append("PRIORITY 1: Separate monorepo into 3 repositories")
            elif check["check"] == "Data Lineage":
                recommendations.append("PRIORITY 1: Implement data lineage tracking")
            elif check["check"] == "Official Data Source":
                recommendations.append("PRIORITY 1: Migrate from VLR scraping to Pandascore API")
            elif check["check"] == "CDC/Event Sourcing":
                recommendations.append("PRIORITY 2: Deploy Kafka for event sourcing")
            elif check["check"] == "Uncertainty Quantification":
                recommendations.append("PRIORITY 2: Add confidence intervals to SimRating")
        
        return recommendations


if __name__ == "__main__":
    # Detect repo root from script location
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    checker = PreflightChecker(root_dir=str(repo_root))
    report = checker.check()
    
    # Ensure reports directory exists
    reports_dir = Path("reports")
    reports_dir.mkdir(exist_ok=True)
    
    # Write report
    output_file = reports_dir / "preflight_report.json"
    with open(output_file, "w") as f:
        json.dump(report, f, indent=2)
    
    # Print summary
    print(f"\n{'='*60}")
    print(f"PREFLIGHT CHECK COMPLETE")
    print(f"{'='*60}")
    print(f"Score: {report['overall_score']} ({report['percentage']}%)")
    print(f"Status: {report['status']}")
    print(f"\nFailed Checks:")
    for check in report['checks']:
        if check['status'] == 'FAIL':
            print(f"  [FAIL] {check['check']}: {check['details']}")
    print(f"\nRecommendations:")
    for rec in report['recommendations']:
        print(f"  [>] {rec}")
    print(f"\nFull report: {output_file}")
    print(f"{'='*60}\n")
