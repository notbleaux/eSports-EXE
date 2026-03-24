[Ver002.000]

# ASYNC CONSOLIDATION PROTOCOL v2.0

**Protocol Version:** 2.0  
**Effective Date:** 2026-03-23  
**Status:** MANDATORY for all Slot 21 agents  
**Supersedes:** ASYNC_CONSOLIDATION_PROTOCOL.md v1.x

---

## Overview

This protocol defines the standardized process for asynchronous consolidation agents (Slot 21) to perform mid-wave and end-wave consolidation of Job Listing Board (JLB) artifacts with **verification-first guarantees**.

### Key Principles

1. **Verification Before Claim:** All file claims must be pre-verified
2. **Single Source of Truth:** One canonical metric per consolidation
3. **Cryptographic Integrity:** All archives include SHA-256 checksums
4. **Transparency:** All operations logged and reversible
5. **Deduplication:** No duplicate content in archives

---

## Slot 21 Reserved Capacity

```
┌─────────────────────────────────────────────────────────────┐
│                    21-SLOT FRAMEWORK                        │
├──────┬──────────────────────────────────────────────────────┤
│ 1-16 │ Standard agents (normal operations)                  │
│ 17-20│ Overflow capacity (peak demand)                      │
│  21  │ 🟢 ASYNC CONSOLIDATION ONLY (reserved)               │
└──────┴──────────────────────────────────────────────────────┘
```

**Slot 21 Agent Types:**
- `ASYNC-CON-{DATE}` — Consolidation agents
- `ASYNC-VER-{DATE}` — Verification agents
- `ASYNC-ARC-{DATE}` — Archival agents

---

## Consolidation Triggers

| Trigger | Condition | Actions |
|---------|-----------|---------|
| **Mid-Wave** | 50% of wave agents complete | Partial consolidation, checkpoint |
| **End-Wave** | 100% of wave agents complete | Full consolidation, archival |
| **Emergency** | On-demand by Foreman | Selective consolidation |
| **Scheduled** | Every 24 hours | Incremental consolidation |

---

## Session Schema

```
SESSION-{DATE}-{ID}/{REQUEST}/{CLASS}/{PHASE}/{CATEGORY}/{WAVE}

Example: SESSION-20260409-001/CONSOLIDATION/P2/OPTIMIZATION/W2/W1
```

| Component | Description |
|-----------|-------------|
| `DATE` | ISO date (YYYYMMDD) |
| `ID` | Sequential number (001-999) |
| `REQUEST` | CONSOLIDATION, VERIFICATION, ARCHIVAL |
| `CLASS` | P1, P2, P3 (Phase) |
| `PHASE` | FOUNDATION, EXPANSION, OPTIMIZATION |
| `CATEGORY` | W1, W2, W3, W4 (Wave number) |
| `WAVE` | W1.0, W1.1, W2.0 (Specific wave) |

---

## Directory Structure

```
.job-board/
├── 00_INBOX/                    # Incoming tasks (per agent)
│   └── {agent-id}/
│
├── 01_LISTINGS/                 # Available tasks
│   ├── ACTIVE/                  # Current listings
│   ├── BACKLOG/                 # Future waves
│   └── ARCHIVED/                # Historical listings
│
├── 02_CLAIMED/                  # Active claims
│   └── {agent-id}/              # Agent work directories
│
├── 03_COMPLETED/                # Completed work
│   ├── WAVE_1_1/
│   ├── WAVE_1_2/
│   ├── WAVE_2_0/
│   └── INDEX.md                 # Wave-level index
│
├── 04_BLOCKS/                   # Obstacles and resolutions
│   └── {block-id}_RESOLUTION.md
│
├── 05_TEMPLATES/                # Task templates
│
├── 06_WORK_HISTORY/             # 🆕 Consolidated work records
│   ├── MASTER_HISTORY.yaml      # Single source of truth
│   ├── AGENT_LOOKUP.json        # Agent → history mapping
│   └── PHASES/                  # Phase-specific histories
│
├── 07_VERIFICATION/             # 🆕 Verification artifacts
│   ├── CHECKSUMS/               # File checksums
│   ├── MANIFESTS/               # Archive manifests
│   └── CONSISTENCY_REPORTS/     # Metric validation
│
├── 08_SESSIONS/                 # Session archives
│   └── {SESSION_ID}/
│       ├── INDEX.md
│       ├── EXECUTIVE_SUMMARY.md
│       ├── VERIFICATION_LOG.md
│       ├── ASYNC_CONSOLIDATION_REPORT.md
│       ├── MANIFEST.json        # 🆕 Archive manifest
│       └── PHASE_{N}/
│           ├── RAW_REPORTS.tar.gz
│           ├── RAW_REPORTS.manifest.json
│           ├── EXECUTIVE_SUMMARY.md
│           └── AGENT_REGISTRY.csv
│
└── FRAMEWORK/
    ├── ASYNC_CONSOLIDATION_PROTOCOL_v2.md  # This file
    └── VERIFICATION_SCRIPTS/
        ├── verify_consolidation.py
        ├── deduplicate.py
        └── generate_manifest.py
```

---

## Consolidation Workflow

### Phase 0: Pre-Flight Checklist

```yaml
pre_flight:
  - verify_slot_21_authorization: true
  - check_disk_space: "> 100MB available"
  - validate_git_status: "clean working tree"
  - load_verification_scripts: true
  - check_dependencies:
      - python: ">= 3.11"
      - tar: "available"
      - sha256sum: "available"
```

### Phase 1: Discovery & Verification

```python
def phase_1_discovery():
    """Step 1: Find all completion reports"""
    
    reports = discover_reports(
        locations=[
            ".job-board/03_COMPLETED/",
            ".job-board/02_CLAIMED/"
        ],
        patterns=["*COMPLETION*.md", "*REPORT*.md"]
    )
    
    # CRITICAL: Verify every file exists before processing
    verification_results = []
    for report in reports:
        result = verify_file(report)
        if not result.exists:
            raise PhantomFileError(f"Claimed file does not exist: {report}")
        verification_results.append(result)
    
    return verification_results
```

**Output:** `VERIFICATION_LOG.json`

### Phase 2: Metric Extraction & Validation

```python
def phase_2_metric_validation(reports):
    """Step 2: Extract and validate metrics"""
    
    metrics = []
    for report in reports:
        data = extract_metrics(report)
        metrics.append(data)
    
    # CRITICAL: Cross-validate for consistency
    consistency_report = validate_consistency(metrics)
    
    if consistency_report.variance > 0.05:  # 5% threshold
        raise MetricInconsistencyError(
            f"Metrics vary by {consistency_report.variance * 100}%"
        )
    
    return consistency_report
```

**Output:** `CONSISTENCY_REPORT.md`

### Phase 3: Deduplication

```python
def phase_3_deduplication(files):
    """Step 3: Remove duplicates before archiving"""
    
    file_hashes = {}
    duplicates = []
    
    for filepath in files:
        file_hash = sha256_file(filepath)
        
        if file_hash in file_hashes:
            duplicates.append({
                "original": file_hashes[file_hash],
                "duplicate": filepath
            })
        else:
            file_hashes[file_hash] = filepath
    
    # Keep only unique files
    unique_files = list(file_hashes.values())
    
    return {
        "unique_files": unique_files,
        "duplicates": duplicates,
        "space_saved": calculate_space_saved(duplicates)
    }
```

**Output:** `DEDUPLICATION_REPORT.md`

### Phase 4: Archive Creation with Manifest

```python
def phase_4_archive_creation(files, phase_name):
    """Step 4: Create archive with manifest"""
    
    manifest = {
        "manifest_version": "2.0",
        "archive_name": f"{phase_name}_RAW_REPORTS.tar.gz",
        "created_at": datetime.now().isoformat(),
        "created_by": get_agent_id(),
        "contents": []
    }
    
    for filepath in files:
        manifest["contents"].append({
            "path": filepath,
            "size": os.path.getsize(filepath),
            "sha256": sha256_file(filepath),
            "agent_id": extract_agent_id(filepath)
        })
    
    # Create archive
    archive_path = create_tar_gz(files, manifest)
    
    # Verify archive integrity
    verify_archive_integrity(archive_path, manifest)
    
    return archive_path, manifest
```

**Output:** `RAW_REPORTS.tar.gz`, `RAW_REPORTS.manifest.json`

### Phase 5: Work History Generation

```python
def phase_5_work_history(reports, manifest):
    """Step 5: Generate structured work history"""
    
    history = {
        "schema_version": "2.0",
        "generated_at": datetime.now().isoformat(),
        "phases": {}
    }
    
    for report in reports:
        agent_data = extract_agent_data(report)
        phase = agent_data["phase"]
        
        if phase not in history["phases"]:
            history["phases"][phase] = {
                "agents": [],
                "total_tests": 0,
                "total_files": 0
            }
        
        history["phases"][phase]["agents"].append({
            "id": agent_data["id"],
            "deliverable": agent_data["deliverable"],
            "tests": agent_data["tests"],
            "completed_at": agent_data["completed_at"],
            "archived": {
                "location": manifest["archive_name"],
                "checksum": find_checksum(manifest, report)
            }
        })
        
        history["phases"][phase]["total_tests"] += agent_data["tests"]
        history["phases"][phase]["total_files"] += 1
    
    return history
```

**Output:** `MASTER_HISTORY.yaml`

### Phase 6: Cleanup

```python
def phase_6_cleanup():
    """Step 6: Remove empty directories and temporary files"""
    
    empty_dirs = find_empty_directories(".job-board/02_CLAIMED/")
    
    for dir_path in empty_dirs:
        age = get_directory_age(dir_path)
        
        if age > timedelta(hours=24):
            archive_or_remove(dir_path)
            log_cleanup(dir_path)
    
    return len(empty_dirs)
```

**Output:** `CLEANUP_LOG.md`

### Phase 7: Final Verification

```python
def phase_7_final_verification():
    """Step 7: Verify all deliverables"""
    
    checklist = [
        "MASTER_INDEX.md exists and is valid",
        "ASYNC_CONSOLIDATION_REPORT.md complete",
        "All archives have manifests",
        "All checksums verified",
        "MASTER_HISTORY.yaml generated",
        "No phantom files claimed",
        "Metric consistency < 5% variance",
        "Empty directories cleaned"
    ]
    
    results = []
    for item in checklist:
        results.append({
            "item": item,
            "passed": verify_item(item)
        })
    
    return results
```

**Output:** `FINAL_VERIFICATION.md`

---

## Verification Scripts

### verify_consolidation.py

```python
#!/usr/bin/env python3
"""
Pre-consolidation verification script.
Run before any archive creation.
"""

import os
import sys
import json
import hashlib
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Optional

@dataclass
class VerificationResult:
    filepath: str
    exists: bool
    size: int
    sha256: Optional[str]
    error: Optional[str] = None

def verify_file(filepath: str) -> VerificationResult:
    """Verify a single file exists and compute checksum."""
    if not os.path.exists(filepath):
        return VerificationResult(
            filepath=filepath,
            exists=False,
            size=0,
            sha256=None,
            error="File does not exist"
        )
    
    size = os.path.getsize(filepath)
    sha256 = hashlib.sha256(open(filepath, 'rb').read()).hexdigest()
    
    return VerificationResult(
        filepath=filepath,
        exists=True,
        size=size,
        sha256=sha256
    )

def verify_consolidation(claimed_files: List[str]) -> Dict:
    """Main verification entry point."""
    results = []
    phantom_files = []
    
    for filepath in claimed_files:
        result = verify_file(filepath)
        results.append(result)
        
        if not result.exists:
            phantom_files.append(filepath)
    
    if phantom_files:
        print("❌ PHANTOM FILES DETECTED:")
        for f in phantom_files:
            print(f"   - {f}")
        sys.exit(1)
    
    return {
        "verified_count": len(results),
        "phantom_count": len(phantom_files),
        "results": results
    }

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--files", nargs="+", required=True)
    parser.add_argument("--output", default="verification_log.json")
    args = parser.parse_args()
    
    result = verify_consolidation(args.files)
    json.dump(result, open(args.output, 'w'), indent=2)
    print(f"✅ Verification complete: {result['verified_count']} files verified")
```

### generate_manifest.py

```python
#!/usr/bin/env python3
"""
Generate archive manifest with checksums.
"""

import os
import json
import hashlib
from datetime import datetime

def generate_manifest(archive_path: str, files: List[str]) -> Dict:
    """Generate manifest for archive."""
    
    manifest = {
        "manifest_version": "2.0",
        "archive_name": os.path.basename(archive_path),
        "created_at": datetime.now().isoformat(),
        "contents": []
    }
    
    total_original = 0
    
    for filepath in files:
        size = os.path.getsize(filepath)
        total_original += size
        
        manifest["contents"].append({
            "path": filepath,
            "size": size,
            "sha256": hashlib.sha256(open(filepath, 'rb').read()).hexdigest()
        })
    
    # Compute archive checksum
    manifest["archive_checksum"] = hashlib.sha256(
        open(archive_path, 'rb').read()
    ).hexdigest()
    
    manifest["compression"] = {
        "algorithm": "gzip",
        "original_size": total_original,
        "compressed_size": os.path.getsize(archive_path)
    }
    
    return manifest

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True)
    parser.add_argument("--files", nargs="+", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    
    manifest = generate_manifest(args.archive, args.files)
    json.dump(manifest, open(args.output, 'w'), indent=2)
    print(f"✅ Manifest generated: {args.output}")
```

---

## Deliverables Checklist

Every async consolidation MUST produce:

| Deliverable | Location | Required |
|-------------|----------|----------|
| `INDEX.md` | Session root | ✅ |
| `EXECUTIVE_SUMMARY.md` | Session root | ✅ |
| `ASYNC_CONSOLIDATION_REPORT.md` | Session root | ✅ |
| `VERIFICATION_LOG.md` | `07_VERIFICATION/` | ✅ |
| `CONSISTENCY_REPORT.md` | `07_VERIFICATION/` | ✅ |
| `DEDUPLICATION_REPORT.md` | `07_VERIFICATION/` | ✅ |
| `MANIFEST.json` | Per phase | ✅ |
| `MASTER_HISTORY.yaml` | `06_WORK_HISTORY/` | ✅ |
| `AGENT_REGISTRY.csv` | Per phase | ✅ |
| `CLEANUP_LOG.md` | Session root | ✅ |
| `FINAL_VERIFICATION.md` | Session root | ✅ |

---

## Error Handling

| Error | Response | Escalation |
|-------|----------|------------|
| Phantom file detected | HALT consolidation | Foreman immediately |
| Metric variance > 5% | HALT, request clarification | Foreman within 1 hour |
| Archive corruption | Regenerate from sources | Auto-retry ×3 |
| Disk space < 100MB | HALT, request cleanup | Foreman immediately |
| Git conflict on lock | Retry with backoff | Auto-retry ×5 |

---

## Quality Gates

Consolidation is NOT complete until:

- [ ] All claimed files verified to exist
- [ ] All metrics consistent within 5%
- [ ] All archives have manifests
- [ ] All checksums validated
- [ ] MASTER_HISTORY.yaml generated
- [ ] Empty directories cleaned
- [ ] Foreman sign-off obtained

---

## Sign-off

**Protocol Author:** Foreman  
**Version:** 2.0  
**Date:** 2026-03-23  
**Status:** MANDATORY

---

*This protocol replaces all previous async consolidation documentation.*
