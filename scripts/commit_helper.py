#!/usr/bin/env python3
"""
Git Commit Helper Script
Validates and formats commit messages according to project conventions.

Usage:
    python scripts/commit_helper.py validate  # Validate recent commits
    python scripts/commit_helper.py format    # Show format guide
    python scripts/commit_helper.py suggest   # Suggest format for staged changes
"""

import subprocess
import re
import sys
from typing import List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class CommitType(Enum):
    FEAT = "feat"
    FIX = "fix"
    DOCS = "docs"
    STYLE = "style"
    REFACTOR = "refactor"
    PERF = "perf"
    TEST = "test"
    CHORE = "chore"
    CI = "ci"
    BUILD = "build"
    REVERT = "revert"


VALID_SCOPES = [
    "api", "web", "sim", "db", "ml", "infra",
    "auth", "docs", "ops", "root", "deps",
    "test", "ci", "release", "security",
    "cert", "registry", "archive"  # Additional project-specific scopes
]


@dataclass
class CommitMessage:
    raw: str
    type_: Optional[str] = None
    scope: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    footer: Optional[str] = None
    
    def __post_init__(self):
        self._parse()
    
    def _parse(self):
        """Parse conventional commit format."""
        lines = self.raw.strip().split('\n')
        if not lines:
            return
        
        # Parse header
        header = lines[0]
        pattern = r'^(\w+)(?:\(([^)]+)\))?: (.+)$'
        match = re.match(pattern, header)
        
        if match:
            self.type_ = match.group(1)
            self.scope = match.group(2)
            self.subject = match.group(3)
        
        # Parse body and footer
        if len(lines) > 1:
            # Skip empty line after header
            body_start = 2 if lines[1].strip() == '' else 1
            body_lines = lines[body_start:]
            
            # Footer starts with specific keywords
            footer_pattern = r'^(BREAKING CHANGE|Closes|Refs|Fixes|Co-authored-by):'
            body_end = len(body_lines)
            
            for i, line in enumerate(body_lines):
                if re.match(footer_pattern, line, re.IGNORECASE):
                    body_end = i
                    break
            
            self.body = '\n'.join(body_lines[:body_end]).strip() or None
            self.footer = '\n'.join(body_lines[body_end:]).strip() or None
    
    def is_valid(self) -> Tuple[bool, List[str]]:
        """Check if commit message follows conventions."""
        errors = []
        
        if not self.type_:
            errors.append("Missing or invalid commit type")
        elif self.type_ not in [t.value for t in CommitType]:
            errors.append(f"Invalid type '{self.type_}'. Valid: {', '.join(t.value for t in CommitType)}")
        
        if self.scope and self.scope not in VALID_SCOPES:
            errors.append(f"Invalid scope '{self.scope}'. Valid: {', '.join(VALID_SCOPES)}")
        
        if not self.subject:
            errors.append("Missing subject")
        elif len(self.subject) > 72:
            errors.append(f"Subject too long ({len(self.subject)} chars, max 72)")
        elif self.subject.endswith('.'):
            errors.append("Subject should not end with period")
        
        if self.body:
            for line in self.body.split('\n'):
                if len(line) > 72:
                    errors.append(f"Body line too long: {line[:50]}...")
        
        return len(errors) == 0, errors
    
    def suggest_improvements(self) -> List[str]:
        """Suggest improvements for the commit message."""
        suggestions = []
        
        # Check for common issues
        if self.raw.startswith('[AUTO]'):
            suggestions.append("Consider using [skip ci] for automated commits or moving to GitHub Actions")
        
        if '&' in (self.subject or ''):
            suggestions.append("Consider splitting into multiple commits (contains '&')")
        
        if self.subject and len(self.subject) < 10:
            suggestions.append("Subject is very short - consider adding more context")
        
        # Check for past tense
        past_tense_words = ['added', 'fixed', 'updated', 'removed', 'changed', 'created']
        if any(word in (self.subject or '').lower() for word in past_tense_words):
            suggestions.append("Use imperative mood (e.g., 'Add' not 'Added')")
        
        # Check for all caps
        if self.subject and self.subject.isupper():
            suggestions.append("Avoid ALL CAPS in subject")
        
        return suggestions


def get_recent_commits(n: int = 10) -> List[CommitMessage]:
    """Get recent commit messages."""
    result = subprocess.run(
        ['git', 'log', '--format=%s', f'-{n}'],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"Error getting commits: {result.stderr}")
        return []
    
    return [CommitMessage(msg) for msg in result.stdout.strip().split('\n') if msg]


def validate_commits():
    """Validate recent commits."""
    print("=" * 70)
    print("RECENT COMMIT VALIDATION")
    print("=" * 70)
    
    commits = get_recent_commits(10)
    
    valid_count = 0
    for i, commit in enumerate(commits, 1):
        is_valid, errors = commit.is_valid()
        suggestions = commit.suggest_improvements()
        
        status = "[PASS]" if is_valid else "[FAIL]"
        print(f"\n{status} Commit {i}: {commit.raw[:60]}{'...' if len(commit.raw) > 60 else ''}")
        
        if errors:
            print("   Errors:")
            for error in errors:
                print(f"      - {error}")
        
        if suggestions:
            print("   Suggestions:")
            for suggestion in suggestions:
                print(f"      [TIP] {suggestion}")
        
        if is_valid and not suggestions:
            print("   [OK] Perfect! No issues found.")
            valid_count += 1
    
    print(f"\n{'=' * 70}")
    print(f"Valid commits: {valid_count}/{len(commits)}")
    print(f"{'=' * 70}\n")


def show_format_guide():
    """Show commit format guide."""
    print("""
╔══════════════════════════════════════════════════════════════════════╗
║                     COMMIT MESSAGE FORMAT GUIDE                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  <type>(<scope>): <subject>                                          ║
║                                                                      ║
║  <body>                                                              ║
║                                                                      ║
║  <footer>                                                            ║
║                                                                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  TYPES: feat, fix, docs, style, refactor, perf, test, chore, ci      ║
║  SCOPES: api, web, sim, db, ml, infra, auth, docs, ops, root         ║
╠══════════════════════════════════════════════════════════════════════╣
║  EXAMPLES:                                                           ║
║  ✅ feat(api): Add tiered API key system                             ║
║  ✅ fix(web): Resolve MatchDetailPanel TypeScript error              ║
║  ✅ docs(adr): Add event sourcing architecture decision              ║
║  ✅ chore(deps): Update pnpm lockfile                                ║
║                                                                      ║
║  ❌ fixed api bug                                                    ║
║  ❌ Update stuff                                                     ║
║  ❌ [AUTO] Health check                                              ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
""")


def suggest_format():
    """Suggest commit format based on staged changes."""
    result = subprocess.run(
        ['git', 'diff', '--cached', '--name-only'],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print("Error getting staged files. Are there any staged changes?")
        return
    
    files = result.stdout.strip().split('\n')
    if not files or files == ['']:
        print("No staged changes found. Stage files with 'git add' first.")
        return
    
    print("=" * 70)
    print("STAGED FILES ANALYSIS")
    print("=" * 70)
    
    # Categorize files
    categories = {
        'api': [],
        'web': [],
        'docs': [],
        'config': [],
        'other': []
    }
    
    for file in files:
        if file.startswith('packages/shared/api/') or file.startswith('services/api/'):
            categories['api'].append(file)
        elif file.startswith('apps/web/'):
            categories['web'].append(file)
        elif file.startswith('docs/') or file.endswith('.md'):
            categories['docs'].append(file)
        elif file.startswith('.github/') or file in ['package.json', 'docker-compose.yml']:
            categories['config'].append(file)
        else:
            categories['other'].append(file)
    
    # Determine scope and type suggestions
    print("\nFile categories:")
    for cat, cat_files in categories.items():
        if cat_files:
            print(f"  {cat}: {len(cat_files)} files")
            for f in cat_files[:3]:
                print(f"    - {f}")
            if len(cat_files) > 3:
                print(f"    ... and {len(cat_files) - 3} more")
    
    # Suggest commit format
    print("\n" + "=" * 70)
    print("SUGGESTED COMMIT FORMAT")
    print("=" * 70)
    
    primary_scope = max(categories, key=lambda k: len(categories[k]))
    if categories[primary_scope]:
        print(f"\nPrimary scope: {primary_scope}")
        print("\nSuggested formats:")
        print(f"  feat({primary_scope}): Add <description of new feature>")
        print(f"  fix({primary_scope}): Resolve <description of bug>")
        print(f"  docs({primary_scope}): Update <description of docs>")
        print(f"  refactor({primary_scope}): <description of refactoring>")
        print("\nExample:")
        print(f"  feat({primary_scope}): Implement new functionality")
    else:
        print("\nUnable to determine scope from staged files.")
        print("Use: feat(scope): Description")


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/commit_helper.py <command>")
        print("\nCommands:")
        print("  validate  - Validate recent commits")
        print("  format    - Show format guide")
        print("  suggest   - Suggest format for staged changes")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'validate':
        validate_commits()
    elif command == 'format':
        show_format_guide()
    elif command == 'suggest':
        suggest_format()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == '__main__':
    main()
