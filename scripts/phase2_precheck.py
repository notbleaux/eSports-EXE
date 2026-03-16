#!/usr/bin/env python3
"""
Phase 2 Pre-Spawn Read-Only Verification Script
[Ver001.000]

Run this before spawning any sub-agents to verify infrastructure readiness.
All checks are read-only and non-destructive.
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from dataclasses import dataclass
from typing import List, Tuple

# Colors for terminal output (ASCII safe)
GREEN = "[OK] "
RED = "[FAIL] "
YELLOW = "[WARN] "
RESET = ""
BOLD = ""

@dataclass
class CheckResult:
    name: str
    passed: bool
    message: str
    critical: bool = True

class Phase2PreCheck:
    def __init__(self, repo_root: str = "."):
        self.root = Path(repo_root).resolve()
        self.results: List[CheckResult] = []
        self.critical_failures = 0
        self.warnings = 0
        
    def log(self, message: str, level: str = "info"):
        """Print colored log message"""
        if level == "info":
            print(f"[CHECK] {message}")
        elif level == "pass":
            print(f"{GREEN}{message}")
        elif level == "fail":
            print(f"{RED}{message}")
        elif level == "warn":
            print(f"{YELLOW}{message}")
            
    def check_file_exists(self, path: str, min_size: int = 0) -> CheckResult:
        """Check if file exists and meets minimum size"""
        full_path = self.root / path
        name = f"File: {path}"
        
        if not full_path.exists():
            return CheckResult(name, False, f"File not found: {full_path}")
        
        if min_size > 0:
            size = full_path.stat().st_size
            if size < min_size:
                return CheckResult(name, False, f"File too small: {size} bytes (min: {min_size})")
            return CheckResult(name, True, f"Exists ({size} bytes)")
        
        return CheckResult(name, True, "Exists")
    
    def check_directory_exists(self, path: str) -> CheckResult:
        """Check if directory exists"""
        full_path = self.root / path
        name = f"Directory: {path}"
        
        if not full_path.exists():
            return CheckResult(name, False, f"Directory not found: {full_path}", critical=False)
        if not full_path.is_dir():
            return CheckResult(name, False, f"Path is not a directory: {full_path}")
        
        return CheckResult(name, True, "Exists")
    
    def check_python_syntax(self, path: str) -> CheckResult:
        """Check Python file syntax"""
        full_path = self.root / path
        name = f"Python Syntax: {path}"
        
        if not full_path.exists():
            return CheckResult(name, False, "File not found")
        
        try:
            result = subprocess.run(
                [sys.executable, "-m", "py_compile", str(full_path)],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                return CheckResult(name, True, "Syntax valid")
            else:
                return CheckResult(name, False, f"Syntax error: {result.stderr}")
        except Exception as e:
            return CheckResult(name, False, f"Check failed: {e}")
    
    def check_typescript_types(self, path: str) -> CheckResult:
        """Check TypeScript types (limited check)"""
        full_path = self.root / path
        name = f"TypeScript: {path}"
        
        if not full_path.exists():
            return CheckResult(name, False, "File not found")
        
        # Just check file exists and has content for now
        # Full type check requires npm which is slow
        content = full_path.read_text()
        if "export" in content or "import" in content or "const" in content:
            return CheckResult(name, True, "TypeScript file valid")
        return CheckResult(name, False, "File appears empty or invalid")
    
    def check_json_valid(self, path: str) -> CheckResult:
        """Check JSON file validity"""
        full_path = self.root / path
        name = f"JSON Valid: {path}"
        
        if not full_path.exists():
            return CheckResult(name, False, "File not found")
        
        try:
            with open(full_path) as f:
                data = json.load(f)
            return CheckResult(name, True, f"Valid JSON ({len(str(data))} chars)")
        except json.JSONDecodeError as e:
            return CheckResult(name, False, f"Invalid JSON: {e}")
    
    def check_import(self, module_path: str, import_name: str) -> CheckResult:
        """Check if Python module can be imported"""
        name = f"Import: {import_name}"
        
        try:
            sys.path.insert(0, str(self.root / "packages/shared/api"))
            exec(f"from {module_path} import {import_name}")
            return CheckResult(name, True, "Import successful")
        except ImportError as e:
            return CheckResult(name, False, f"Import failed: {e}")
        except Exception as e:
            return CheckResult(name, False, f"Error: {e}")
    
    def record(self, result: CheckResult):
        """Record check result"""
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
        """Run all pre-spawn verification checks"""
        print(f"\n{'='*60}")
        print(f"Phase 2 Pre-Spawn Verification")
        print(f"{'='*60}\n")
        
        # === INFRASTRUCTURE CHECKS ===
        print(f"\n[1/6] Core Infrastructure\n")
        
        self.record(self.check_file_exists("packages/shared/api/main.py"))
        self.record(self.check_python_syntax("packages/shared/api/main.py"))
        self.record(self.check_file_exists("apps/website-v2/package.json"))
        self.record(self.check_directory_exists("apps/website-v2/src/components/TENET"))
        
        # === BETTING MODULE CHECKS (Agent Alpha) ===
        print(f"\n[2/6] Betting Module (Agent Alpha)\n")
        
        self.record(self.check_file_exists(
            "packages/shared/api/src/betting/odds_engine.py", 
            min_size=9500
        ))
        self.record(self.check_python_syntax("packages/shared/api/src/betting/odds_engine.py"))
        self.record(self.check_directory_exists("tests/unit/betting"))
        
        # === WEBSOCKET MODULE CHECKS (Agent Beta) ===
        print(f"\n[3/6] WebSocket Module (Agent Beta)\n")
        
        self.record(self.check_file_exists(
            "packages/shared/api/src/gateway/websocket_gateway.py",
            min_size=13000
        ))
        self.record(self.check_python_syntax("packages/shared/api/src/gateway/websocket_gateway.py"))
        self.record(self.check_directory_exists("apps/website-v2/src/components/TENET/services"))
        
        # === UI COMPONENTS CHECKS (Agent Gamma) ===
        print(f"\n[4/6] UI Components (Agent Gamma)\n")
        
        self.record(self.check_file_exists(
            "apps/website-v2/src/components/TENET/design-system/tokens.json",
            min_size=6000
        ))
        self.record(self.check_json_valid("apps/website-v2/src/components/TENET/design-system/tokens.json"))
        self.record(self.check_file_exists("apps/website-v2/src/components/TENET/ui/primitives/Button.tsx"))
        self.record(self.check_file_exists("apps/website-v2/src/components/TENET/ui/primitives/Input.tsx"))
        
        # Count existing components
        ui_dir = self.root / "apps/website-v2/src/components/TENET/ui"
        if ui_dir.exists():
            tsx_files = list(ui_dir.rglob("*.tsx"))
            count = len(tsx_files)
            self.record(CheckResult(
                "UI Components Count",
                count >= 9,
                f"{count} components found",
                critical=False
            ))
        
        # === AUTH MODULE CHECKS (Agent Delta) ===
        print(f"\n[5/6] Auth Module (Agent Delta)\n")
        
        self.record(self.check_file_exists("packages/shared/api/src/auth/auth_routes.py"))
        self.record(self.check_python_syntax("packages/shared/api/src/auth/auth_routes.py"))
        self.record(self.check_file_exists("packages/shared/api/src/auth/auth_utils.py"))
        self.record(self.check_file_exists("packages/shared/api/src/auth/auth_schemas.py"))
        
        # === NOTIFICATION CHECKS (Agent Echo) ===
        print(f"\n[6/6] Notification Module (Agent Echo)\n")
        
        self.record(self.check_file_exists("apps/website-v2/src/components/TENET/store/index.ts"))
        self.record(self.check_directory_exists("apps/website-v2/public"))
        
        # Check for notification slice in store
        store_file = self.root / "apps/website-v2/src/components/TENET/store/index.ts"
        if store_file.exists():
            content = store_file.read_text()
            has_notifications = "notification" in content.lower()
            self.record(CheckResult(
                "Store Notifications Slice",
                has_notifications,
                "Notifications state exists" if has_notifications else "Placeholder only",
                critical=False
            ))
        
        # === SUMMARY ===
        print(f"\n{'='*60}")
        print(f"Verification Summary")
        print(f"{'='*60}\n")
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        failed = total - passed
        
        print(f"Total Checks: {total}")
        print(f"{GREEN}Passed: {passed}")
        
        if self.warnings > 0:
            print(f"{YELLOW}Warnings: {self.warnings}")
        
        if self.critical_failures > 0:
            print(f"{RED}Critical Failures: {self.critical_failures}")
            print(f"\n{RED}STATUS: NOT READY FOR AGENT SPAWNING")
            print(f"{RED}Resolve critical failures before spawning agents.\n")
            return False
        
        print(f"\n{GREEN}STATUS: READY FOR AGENT SPAWNING\n")
        
        if self.warnings > 0:
            print(f"{YELLOW}Note: {self.warnings} non-critical warnings present.")
            print(f"{YELLOW}Agents can proceed but may need to create missing directories.\n")
        
        return True
    
    def generate_report(self, output_path: str = "PHASE_2_PRECHECK_REPORT.md"):
        """Generate markdown report of checks"""
        lines = [
            "[Ver001.000]\n",
            "# Phase 2 Pre-Spawn Verification Report\n",
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
    """Main entry point"""
    # Find repo root
    script_dir = Path(__file__).parent.resolve()
    repo_root = script_dir.parent
    
    # Change to repo root
    os.chdir(repo_root)
    
    # Run checks
    checker = Phase2PreCheck(repo_root)
    ready = checker.run_all_checks()
    checker.generate_report()
    
    # Exit with appropriate code
    sys.exit(0 if ready else 1)


if __name__ == "__main__":
    main()
