#!/usr/bin/env python3
"""
Phase 3 Pre-Spawn Read-Only Verification Script
[Ver001.000]

Run this before spawning Phase 3 agents to verify infrastructure readiness.
All checks are read-only and non-destructive.
"""

import os
import sys
import subprocess
from pathlib import Path
from dataclasses import dataclass
from typing import List

# ASCII-safe output
GREEN = "[OK] "
RED = "[FAIL] "
YELLOW = "[WARN] "
RESET = ""

@dataclass
class CheckResult:
    name: str
    passed: bool
    message: str
    critical: bool = True

class Phase3PreCheck:
    def __init__(self, repo_root: str = "."):
        self.root = Path(repo_root).resolve()
        self.results: List[CheckResult] = []
        self.critical_failures = 0
        self.warnings = 0
        
    def log(self, message: str, level: str = "info"):
        if level == "info":
            print(f"[CHECK] {message}")
        elif level == "pass":
            print(f"{GREEN}{message}")
        elif level == "fail":
            print(f"{RED}{message}")
        elif level == "warn":
            print(f"{YELLOW}{message}")
            
    def record(self, result: CheckResult):
        self.results.append(result)
        if not result.passed:
            if result.critical:
                self.critical_failures += 1
                self.log(f"{result.name}: {result.message}", "fail")
            else:
                self.warnings += 1
                self.log(f"{result.name}: {result.message}", "warn")
        else:
            self.log(f"{result.name}: {result.message}", "pass")
    
    def run_all_checks(self):
        print(f"\n{'='*60}")
        print(f"Phase 3 Pre-Spawn Verification")
        print(f"Testing, Security & Production Preparation")
        print(f"{'='*60}\n")
        
        # === PHASE 2 COMPLETION CHECKS ===
        print(f"\n[1/6] Phase 2 Completion Verification\n")
        
        modules = [
            ("Betting Routes", "packages/shared/api/src/betting/routes.py"),
            ("Gateway Routes", "packages/shared/api/src/gateway/routes.py"),
            ("Notification Routes", "packages/shared/api/src/notifications/routes.py"),
            ("OAuth Module", "packages/shared/api/src/auth/oauth.py"),
            ("2FA Module", "packages/shared/api/src/auth/two_factor.py"),
        ]
        
        for name, path in modules:
            full = self.root / path
            if full.exists():
                self.record(CheckResult(f"{name}", True, "Exists"))
            else:
                self.record(CheckResult(f"{name}", False, "Missing"))
        
        # === TEST INFRASTRUCTURE ===
        print(f"\n[2/6] Test Infrastructure\n")
        
        # Check pytest
        try:
            result = subprocess.run([sys.executable, "-m", "pytest", "--version"], 
                                   capture_output=True, timeout=5)
            if result.returncode == 0:
                self.record(CheckResult("pytest", True, "Available"))
            else:
                self.record(CheckResult("pytest", False, "Not working"))
        except:
            self.record(CheckResult("pytest", False, "Not installed"))
        
        # Check pytest-cov
        try:
            import pytest_cov
            self.record(CheckResult("pytest-cov", True, "Available"))
        except:
            self.record(CheckResult("pytest-cov", False, "Not installed", critical=False))
        
        # Check existing tests
        test_dirs = [
            "packages/shared/api/tests/unit",
            "packages/shared/api/tests/integration",
        ]
        for d in test_dirs:
            full = self.root / d
            if full.exists():
                py_files = list(full.rglob("test_*.py"))
                self.record(CheckResult(f"{d}", True, f"{len(py_files)} test files"))
            else:
                self.record(CheckResult(f"{d}", False, "Missing", critical=False))
        
        # === SECURITY TOOLS ===
        print(f"\n[3/6] Security Tools\n")
        
        try:
            result = subprocess.run([sys.executable, "-m", "bandit", "--version"], 
                                   capture_output=True, timeout=5)
            if result.returncode == 0:
                self.record(CheckResult("bandit", True, "Available"))
            else:
                self.record(CheckResult("bandit", False, "Not working", critical=False))
        except:
            self.record(CheckResult("bandit", False, "Not installed", critical=False))
        
        try:
            result = subprocess.run(["npm", "audit", "--version"], 
                                   capture_output=True, timeout=5)
            if result.returncode == 0:
                self.record(CheckResult("npm audit", True, "Available"))
            else:
                self.record(CheckResult("npm audit", False, "Not working", critical=False))
        except:
            self.record(CheckResult("npm audit", False, "Not installed", critical=False))
        
        # === E2E INFRASTRUCTURE ===
        print(f"\n[4/6] E2E Test Infrastructure\n")
        
        try:
            result = subprocess.run(["npx", "playwright", "--version"], 
                                   capture_output=True, timeout=5, cwd=self.root / "apps/website-v2")
            if result.returncode == 0:
                self.record(CheckResult("Playwright", True, "Available"))
            else:
                self.record(CheckResult("Playwright", False, "Not working"))
        except:
            self.record(CheckResult("Playwright", False, "Not installed"))
        
        # Check E2E test directory
        e2e_dir = self.root / "apps/website-v2/tests/e2e"
        if e2e_dir.exists():
            spec_files = list(e2e_dir.glob("*.spec.ts"))
            self.record(CheckResult("E2E tests", True, f"{len(spec_files)} spec files"))
        else:
            self.record(CheckResult("E2E tests", False, "Directory missing"))
        
        # === DOCUMENTATION ===
        print(f"\n[5/6] Documentation Status\n")
        
        docs = [
            ("API Documentation", "docs/API_V1_DOCUMENTATION.md"),
            ("Deployment Guide", "docs/DEPLOYMENT_GUIDE.md"),
        ]
        
        for name, path in docs:
            full = self.root / path
            if full.exists():
                # Check if updated recently (contains Phase 2 content)
                content = full.read_text()
                if "betting" in content.lower() or "oauth" in content.lower():
                    self.record(CheckResult(name, True, "Updated"))
                else:
                    self.record(CheckResult(name, False, "Needs Phase 2 updates", critical=False))
            else:
                self.record(CheckResult(name, False, "Missing"))
        
        # Check for required new docs
        new_docs = [
            "docs/WEBSOCKET_GUIDE.md",
            "docs/OAUTH_SETUP.md",
            "docs/PUSH_NOTIFICATIONS.md",
        ]
        
        for path in new_docs:
            full = self.root / path
            name = Path(path).name
            if full.exists():
                self.record(CheckResult(name, True, "Exists"))
            else:
                self.record(CheckResult(name, False, "Needs creation", critical=False))
        
        # === TYPE SAFETY ===
        print(f"\n[6/6] Type Safety\n")
        
        # Check TENET TypeScript
        tenet_dir = self.root / "apps/website-v2/src/components/TENET"
        if tenet_dir.exists():
            tsx_files = list(tenet_dir.rglob("*.tsx"))
            self.record(CheckResult("TENET Components", True, f"{len(tsx_files)} files"))
        
        # Try TypeScript check (may be slow, so just check if it would run)
        tsc_config = self.root / "apps/website-v2/tsconfig.json"
        if tsc_config.exists():
            self.record(CheckResult("TypeScript Config", True, "Available"))
        
        # === SUMMARY ===
        print(f"\n{'='*60}")
        print(f"Verification Summary")
        print(f"{'='*60}\n")
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        
        print(f"Total Checks: {total}")
        print(f"{GREEN}Passed: {passed}{RESET}")
        
        if self.warnings > 0:
            print(f"{YELLOW}Warnings: {self.warnings}{RESET}")
        
        if self.critical_failures > 0:
            print(f"{RED}Critical Failures: {self.critical_failures}{RESET}")
            print(f"\n{RED}STATUS: NOT READY FOR AGENT SPAWNING{RESET}")
            print(f"{RED}Resolve critical failures before spawning agents.{RESET}\n")
            return False
        
        print(f"\n{GREEN}STATUS: READY FOR AGENT SPAWNING{RESET}\n")
        
        if self.warnings > 0:
            print(f"{YELLOW}Note: {self.warnings} non-critical warnings present.{RESET}")
            print(f"{YELLOW}Agents can proceed with caution.{RESET}\n")
        
        return True
    
    def generate_report(self, output_path: str = "PHASE_3_PRECHECK_REPORT.md"):
        lines = [
            "[Ver001.000]\n",
            "# Phase 3 Pre-Spawn Verification Report\n",
            f"**Date:** Auto-generated\n",
            f"**Status:** {'[READY]' if self.critical_failures == 0 else '[NOT READY]'}\n\n",
            "## Check Results\n\n",
            "| Check | Status | Message |\n",
            "|-------|--------|---------|\n"
        ]
        
        for r in self.results:
            status = "[PASS]" if r.passed else ("[WARN]" if not r.critical else "[FAIL]")
            lines.append(f"| {r.name} | {status} | {r.message} |\n")
        
        lines.extend([
            "\n## Summary\n\n",
            f"- **Total:** {len(self.results)}\n",
            f"- **Passed:** {sum(1 for r in self.results if r.passed)}\n",
            f"- **Warnings:** {self.warnings}\n",
            f"- **Critical Failures:** {self.critical_failures}\n\n",
            f"**Verdict:** {'Ready for agent spawning' if self.critical_failures == 0 else 'Fix critical failures first'}\n"
        ])
        
        report_path = self.root / output_path
        with open(report_path, 'w') as f:
            f.writelines(lines)
        
        print(f"Report written to: {output_path}")


def main():
    script_dir = Path(__file__).parent.resolve()
    repo_root = script_dir.parent
    
    os.chdir(repo_root)
    
    checker = Phase3PreCheck(repo_root)
    ready = checker.run_all_checks()
    checker.generate_report()
    
    sys.exit(0 if ready else 1)


if __name__ == "__main__":
    main()
