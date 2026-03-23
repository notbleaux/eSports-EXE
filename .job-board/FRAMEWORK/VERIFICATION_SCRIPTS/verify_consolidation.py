#!/usr/bin/env python3
"""
SATOR JLB Consolidation Verification Script
Version: 2.0
Purpose: Pre-archive verification with integrity checks
"""

import os
import sys
import json
import hashlib
import argparse
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import re

@dataclass
class VerificationResult:
    filepath: str
    exists: bool
    size: int = 0
    sha256: Optional[str] = None
    error: Optional[str] = None
    
    def to_dict(self):
        return asdict(self)

@dataclass
class MetricExtraction:
    source_file: str
    tests: Optional[int] = None
    coverage: Optional[float] = None
    lines_of_code: Optional[int] = None
    files_created: Optional[int] = None
    agents: Optional[int] = None

class ConsolidationVerifier:
    """Main verification engine for JLB consolidation."""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.errors = []
        self.warnings = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log message with level."""
        if self.verbose or level in ["ERROR", "WARNING"]:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[{timestamp}] [{level}] {message}")
    
    def verify_file(self, filepath: str) -> VerificationResult:
        """Verify a single file exists and compute checksum."""
        if not os.path.exists(filepath):
            return VerificationResult(
                filepath=filepath,
                exists=False,
                error="File does not exist"
            )
        
        try:
            size = os.path.getsize(filepath)
            with open(filepath, 'rb') as f:
                sha256 = hashlib.sha256(f.read()).hexdigest()
            
            return VerificationResult(
                filepath=filepath,
                exists=True,
                size=size,
                sha256=sha256
            )
        except Exception as e:
            return VerificationResult(
                filepath=filepath,
                exists=True,
                error=f"Read error: {str(e)}"
            )
    
    def verify_files(self, file_list: List[str]) -> Tuple[List[VerificationResult], List[str]]:
        """Verify multiple files, return results and phantom files."""
        results = []
        phantom_files = []
        
        self.log(f"Verifying {len(file_list)} files...")
        
        for filepath in file_list:
            result = self.verify_file(filepath)
            results.append(result)
            
            if not result.exists:
                phantom_files.append(filepath)
                self.log(f"Phantom file: {filepath}", "ERROR")
            elif self.verbose:
                self.log(f"✅ Verified: {filepath} ({result.size} bytes)")
        
        return results, phantom_files
    
    def extract_metrics_from_markdown(self, filepath: str) -> MetricExtraction:
        """Extract test/coverage metrics from markdown completion reports."""
        metrics = MetricExtraction(source_file=filepath)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Look for test counts
            test_patterns = [
                r'[Tt]ests[:\s]+(\d+)',
                r'(\d+)\s*[Tt]ests',
                r'[Tt]est\s*[Cc]ount[:\s]+(\d+)',
            ]
            
            for pattern in test_patterns:
                match = re.search(pattern, content)
                if match:
                    metrics.tests = int(match.group(1))
                    break
            
            # Look for coverage percentage
            coverage_patterns = [
                r'[Cc]overage[:\s]+(\d+\.?\d*)%',
                r'(\d+\.?\d*)%\s*[Cc]overage',
            ]
            
            for pattern in coverage_patterns:
                match = re.search(pattern, content)
                if match:
                    metrics.coverage = float(match.group(1))
                    break
            
            # Look for lines of code
            loc_patterns = [
                r'([\d,]+)\s*[Ll]ines\s+of\s+[Cc]ode',
                r'LOC[:\s]+([\d,]+)',
            ]
            
            for pattern in loc_patterns:
                match = re.search(pattern, content)
                if match:
                    metrics.lines_of_code = int(match.group(1).replace(',', ''))
                    break
            
            # Look for files created
            files_patterns = [
                r'([\d,]+)\s*[Ff]iles\s+[Cc]reated',
                r'[Ff]iles[:\s]+([\d,]+)',
            ]
            
            for pattern in files_patterns:
                match = re.search(pattern, content)
                if match:
                    metrics.files_created = int(match.group(1).replace(',', ''))
                    break
            
        except Exception as e:
            self.log(f"Error extracting metrics from {filepath}: {e}", "WARNING")
        
        return metrics
    
    def validate_metric_consistency(self, metrics_list: List[MetricExtraction], 
                                     variance_threshold: float = 0.05) -> Dict:
        """Validate that metrics are consistent across documents."""
        self.log("Validating metric consistency...")
        
        # Group by metric type
        tests_values = [m.tests for m in metrics_list if m.tests is not None]
        coverage_values = [m.coverage for m in metrics_list if m.coverage is not None]
        
        inconsistencies = []
        
        # Check for test count variance (sum across files should be consistent)
        if tests_values:
            total_tests = sum(tests_values)
            self.log(f"Total tests found: {total_tests}")
        
        # Check for coverage variance
        if coverage_values:
            avg_coverage = sum(coverage_values) / len(coverage_values)
            max_coverage = max(coverage_values)
            min_coverage = min(coverage_values)
            coverage_range = max_coverage - min_coverage
            
            if len(coverage_values) > 1:
                variance = coverage_range / avg_coverage if avg_coverage > 0 else 0
                self.log(f"Coverage range: {min_coverage:.1f}% - {max_coverage:.1f}% (variance: {variance:.2%})")
                
                if variance > variance_threshold:
                    inconsistencies.append({
                        "metric": "coverage",
                        "variance": variance,
                        "threshold": variance_threshold,
                        "message": f"Coverage variance {variance:.2%} exceeds threshold {variance_threshold:.2%}"
                    })
        
        return {
            "consistent": len(inconsistencies) == 0,
            "inconsistencies": inconsistencies,
            "summary": {
                "total_tests": sum(tests_values) if tests_values else None,
                "avg_coverage": sum(coverage_values) / len(coverage_values) if coverage_values else None
            }
        }
    
    def find_empty_directories(self, root_path: str, min_age_hours: int = 24) -> List[str]:
        """Find empty directories older than threshold."""
        empty_dirs = []
        
        for dirpath, dirnames, filenames in os.walk(root_path):
            if not dirnames and not filenames:
                # Check age
                stat = os.stat(dirpath)
                age_hours = (datetime.now().timestamp() - stat.st_mtime) / 3600
                
                if age_hours >= min_age_hours:
                    empty_dirs.append(dirpath)
        
        return empty_dirs
    
    def generate_verification_report(self, results: List[VerificationResult],
                                      consistency: Dict,
                                      output_path: str):
        """Generate JSON verification report."""
        report = {
            "generated_at": datetime.now().isoformat(),
            "verifier": "ConsolidationVerifier v2.0",
            "summary": {
                "total_files": len(results),
                "verified_files": sum(1 for r in results if r.exists and not r.error),
                "phantom_files": sum(1 for r in results if not r.exists),
                "error_files": sum(1 for r in results if r.error),
                "metrics_consistent": consistency["consistent"]
            },
            "file_results": [r.to_dict() for r in results],
            "consistency_check": consistency
        }
        
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        self.log(f"Verification report saved: {output_path}")
        return report
    
    def verify_consolidation(self, file_patterns: List[str], 
                              output_dir: str = ".job-board/07_VERIFICATION") -> bool:
        """Main entry point for consolidation verification."""
        self.log("=== JLB CONSOLIDATION VERIFICATION ===")
        
        # Discover files
        all_files = []
        for pattern in file_patterns:
            matched = list(Path('.').rglob(pattern))
            all_files.extend([str(m) for m in matched])
        
        all_files = list(set(all_files))  # Deduplicate
        self.log(f"Discovered {len(all_files)} files matching patterns: {file_patterns}")
        
        # Phase 1: Verify all files exist
        results, phantom_files = self.verify_files(all_files)
        
        if phantom_files:
            self.log(f"❌ CRITICAL: {len(phantom_files)} phantom files detected", "ERROR")
            for pf in phantom_files:
                self.log(f"   - {pf}", "ERROR")
            return False
        
        # Phase 2: Extract and validate metrics
        metrics_list = []
        for filepath in all_files:
            if filepath.endswith('.md'):
                metrics = self.extract_metrics_from_markdown(filepath)
                metrics_list.append(metrics)
        
        consistency = self.validate_metric_consistency(metrics_list)
        
        if not consistency["consistent"]:
            self.log("⚠️ Metric inconsistencies detected:", "WARNING")
            for inc in consistency["inconsistencies"]:
                self.log(f"   - {inc['message']}", "WARNING")
        
        # Phase 3: Check for empty directories
        empty_dirs = self.find_empty_directories(".job-board/02_CLAIMED")
        if empty_dirs:
            self.log(f"⚠️ {len(empty_dirs)} empty directories found", "WARNING")
            for ed in empty_dirs:
                self.log(f"   - {ed}")
        
        # Generate report
        os.makedirs(output_dir, exist_ok=True)
        report_path = os.path.join(output_dir, 
                                   f"verification_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        report = self.generate_verification_report(results, consistency, report_path)
        
        # Final verdict
        success = (report["summary"]["phantom_files"] == 0 and 
                   consistency["consistent"])
        
        if success:
            self.log("✅ VERIFICATION PASSED - Safe to proceed with consolidation")
        else:
            self.log("❌ VERIFICATION FAILED - Fix issues before consolidating", "ERROR")
        
        return success


def main():
    parser = argparse.ArgumentParser(
        description="Verify JLB consolidation before archiving"
    )
    parser.add_argument(
        "--patterns", 
        nargs="+", 
        default=["*COMPLETION*.md", "*REPORT*.md"],
        help="File patterns to verify"
    )
    parser.add_argument(
        "--output-dir",
        default=".job-board/07_VERIFICATION",
        help="Output directory for verification reports"
    )
    parser.add_argument(
        "--variance-threshold",
        type=float,
        default=0.05,
        help="Maximum allowed metric variance (0.05 = 5%)"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    verifier = ConsolidationVerifier(verbose=args.verbose)
    success = verifier.verify_consolidation(
        file_patterns=args.patterns,
        output_dir=args.output_dir
    )
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
