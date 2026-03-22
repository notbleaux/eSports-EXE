[Ver001.000]

# Playbook 4: Agent Coordination

## Objective
Set up a filesystem-based coordination system for AI agents working on the 4NJZ4 TENET Platform. This includes implementing lock files, restoring the Job Listing Board (JLB) structure, and establishing multi-agent workflow patterns.

## Prerequisites
- [ ] Git repository initialized
- [ ] Write access to project directory
- [ ] Understanding of agent coordination patterns
- [ ] Access to `.job-board/` directory (create if missing)

## Step-by-Step Instructions

### Step 1: Create JLB Directory Structure

**Objective:** Establish the Job Listing Board filesystem hierarchy.

```bash
# From project root
mkdir -p .job-board/{00_INBOX,01_LISTINGS/ACTIVE,02_CLAIMED,03_COMPLETED,04_BLOCKS,05_TEMPLATES}

# Create agent-specific directories (examples)
mkdir -p .job-board/00_INBOX/agent-{001..005}
mkdir -p .job-board/02_CLAIMED/agent-{001..005}

# Create README for the job board
touch .job-board/README.md
```

**Directory Structure:**

```
.job-board/
├── README.md                    # JLB documentation
├── 00_INBOX/                    # Incoming task queues
│   ├── agent-001/
│   ├── agent-002/
│   └── ...
├── 01_LISTINGS/                 # Available tasks
│   └── ACTIVE/                  # Active job listings
├── 02_CLAIMED/                  # Claimed tasks
│   ├── agent-001/
│   ├── agent-002/
│   └── ...
├── 03_COMPLETED/                # Completed tasks
├── 04_BLOCKS/                   # Blockers and solutions
└── 05_TEMPLATES/                # Task templates
    ├── task-template.md
    └── blocker-template.md
```

**Create Directory README:**

```bash
cat > .job-board/README.md << 'EOF'
[Ver001.000]

# Job Listing Board (JLB)

## Purpose
Filesystem-based coordination system for AI agents working on the 4NJZ4 TENET Platform.

## Directory Structure

| Directory | Purpose | Who Writes |
|-----------|---------|------------|
| `00_INBOX/{agent-id}/` | Agent's personal incoming queue | Foreman, other agents |
| `01_LISTINGS/ACTIVE/` | Available tasks for claiming | Foreman, project leads |
| `02_CLAIMED/{agent-id}/` | Tasks currently being worked on | Claiming agent |
| `03_COMPLETED/` | Finished tasks with summaries | Completing agent |
| `04_BLOCKS/` | Obstacles and their solutions | Any agent |
| `05_TEMPLATES/` | Standardized templates | Project maintainers |

## Workflow

1. **Foreman** creates tasks in `01_LISTINGS/ACTIVE/`
2. **Agents** claim tasks by moving them to `02_CLAIMED/{agent-id}/`
3. **Agents** work on tasks, updating progress files
4. On completion, agents move tasks to `03_COMPLETED/`
5. Blockers are documented in `04_BLOCKS/`

## Foreman Schedule

- Activates at :00 and :30 (30-minute blocks)
- Maximum 1 foreman active at any time
- Privileges expire after exactly 30 minutes

## File Naming Conventions

- Tasks: `TASK-{id}-{short-name}.md`
- Blockers: `BLOCK-{id}-{short-name}.md`
- Templates: `TEMPLATE-{type}.md`
EOF
```

**Verification:**
```bash
# Verify structure
find .job-board -type d | sort

# Verify README exists
cat .job-board/README.md | head -20
```

### Step 2: Implement Lock File System

**Objective:** Create lock files to prevent conflicts.

```bash
# Create lock directory
mkdir -p .job-board/.locks

# Create lock file utility script
cat > scripts/jlb-lock.sh << 'EOF'
#!/bin/bash
# JLB Lock File Manager

LOCK_DIR=".job-board/.locks"
AGENT_ID="${1:-unknown}"
RESOURCE="${2:-}"
ACTION="${3:-acquire}"

mkdir -p "$LOCK_DIR"

LOCK_FILE="$LOCK_DIR/${RESOURCE}.lock"

acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local owner=$(cat "$LOCK_FILE" | grep "AGENT:" | cut -d: -f2)
        local timestamp=$(cat "$LOCK_FILE" | grep "TIMESTAMP:" | cut -d: -f2)
        echo "FAILED: Lock held by $owner since $timestamp"
        return 1
    fi
    
    cat > "$LOCK_FILE" << LOCKFILE
AGENT:$AGENT_ID
TIMESTAMP:$(date -Iseconds)
RESOURCE:$RESOURCE
LOCKFILE
    
    echo "ACQUIRED: Lock for $RESOURCE"
    return 0
}

release_lock() {
    if [ ! -f "$LOCK_FILE" ]; then
        echo "FAILED: No lock exists for $RESOURCE"
        return 1
    fi
    
    local owner=$(cat "$LOCK_FILE" | grep "AGENT:" | cut -d: -f2)
    if [ "$owner" != "$AGENT_ID" ]; then
        echo "FAILED: Lock owned by $owner, not $AGENT_ID"
        return 1
    fi
    
    rm "$LOCK_FILE"
    echo "RELEASED: Lock for $RESOURCE"
    return 0
}

check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        cat "$LOCK_FILE"
        return 0
    else
        echo "FREE: No lock on $RESOURCE"
        return 1
    fi
}

case "$ACTION" in
    acquire)
        acquire_lock
        ;;
    release)
        release_lock
        ;;
    check)
        check_lock
        ;;
    *)
        echo "Usage: $0 <agent-id> <resource> [acquire|release|check]"
        exit 1
        ;;
esac
EOF

chmod +x scripts/jlb-lock.sh
```

**Create Lock Utility (Python):**

```python
# scripts/jlb_lock.py
#!/usr/bin/env python3
"""JLB Lock File Manager - Python implementation."""

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

LOCK_DIR = Path(".job-board/.locks")


def acquire_lock(agent_id: str, resource: str) -> bool:
    """Acquire a lock on a resource."""
    LOCK_DIR.mkdir(parents=True, exist_ok=True)
    lock_file = LOCK_DIR / f"{resource}.lock"
    
    if lock_file.exists():
        content = lock_file.read_text()
        owner = next(
            (line.split(":", 1)[1] for line in content.split("\n") if line.startswith("AGENT:")),
            "unknown"
        )
        print(f"FAILED: Lock held by {owner}", file=sys.stderr)
        return False
    
    lock_file.write_text(
        f"AGENT:{agent_id}\n"
        f"TIMESTAMP:{datetime.now(timezone.utc).isoformat()}\n"
        f"RESOURCE:{resource}\n"
    )
    print(f"ACQUIRED: Lock for {resource}")
    return True


def release_lock(agent_id: str, resource: str) -> bool:
    """Release a lock on a resource."""
    lock_file = LOCK_DIR / f"{resource}.lock"
    
    if not lock_file.exists():
        print(f"FAILED: No lock exists for {resource}", file=sys.stderr)
        return False
    
    content = lock_file.read_text()
    owner = next(
        (line.split(":", 1)[1] for line in content.split("\n") if line.startswith("AGENT:")),
        "unknown"
    )
    
    if owner != agent_id:
        print(f"FAILED: Lock owned by {owner}, not {agent_id}", file=sys.stderr)
        return False
    
    lock_file.unlink()
    print(f"RELEASED: Lock for {resource}")
    return True


def check_lock(resource: str) -> bool:
    """Check if a resource is locked."""
    lock_file = LOCK_DIR / f"{resource}.lock"
    
    if lock_file.exists():
        print(lock_file.read_text())
        return True
    else:
        print(f"FREE: No lock on {resource}")
        return False


def main():
    parser = argparse.ArgumentParser(description="JLB Lock Manager")
    parser.add_argument("agent_id", help="Agent identifier")
    parser.add_argument("resource", help="Resource to lock")
    parser.add_argument(
        "action",
        choices=["acquire", "release", "check"],
        default="acquire",
        nargs="?"
    )
    
    args = parser.parse_args()
    
    if args.action == "acquire":
        success = acquire_lock(args.agent_id, args.resource)
    elif args.action == "release":
        success = release_lock(args.agent_id, args.resource)
    else:
        success = check_lock(args.resource)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
```

**Verification:**
```bash
# Test lock acquisition
python scripts/jlb_lock.py agent-001 test-resource acquire

# Test lock check
python scripts/jlb_lock.py agent-001 test-resource check

# Test lock from different agent (should fail)
python scripts/jlb_lock.py agent-002 test-resource acquire || echo "Expected failure"

# Release lock
python scripts/jlb_lock.py agent-001 test-resource release

# Verify released
python scripts/jlb_lock.py agent-001 test-resource check
```

### Step 3: Create Task Templates

**Objective:** Standardize task creation with templates.

```bash
# Create task template
cat > .job-board/05_TEMPLATES/TASK-template.md << 'EOF'
[Ver001.000]

# Task: {TASK_NAME}

**ID:** TASK-{NNNN}  
**Priority:** [CRITICAL/HIGH/MEDIUM/LOW]  
**Estimated Duration:** {X} minutes  
**Skill Required:** {skill-name}  
**Created:** {YYYY-MM-DD HH:MM}  
**Claimed By:** {agent-id or UNCLAIMED}  
**Due:** {YYYY-MM-DD HH:MM or NONE}

---

## Objective
{Clear description of what needs to be done}

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Context
{Background information, relevant files, links}

## Dependencies
- [ ] Dependency 1
- [ ] Dependency 2

## Notes
{Additional notes, hints, warnings}

---

## Progress Log

### {YYYY-MM-DD HH:MM} - Started
{Initial notes}

### {YYYY-MM-DD HH:MM} - Update
{Progress update}

## Completion Summary
{Summary of what was done, any issues encountered}
EOF

# Create blocker template
cat > .job-board/05_TEMPLATES/BLOCKER-template.md << 'EOF'
[Ver001.000]

# Blocker: {BLOCKER_NAME}

**ID:** BLOCK-{NNNN}  
**Severity:** [BLOCKING/HIGH/MEDIUM/LOW]  
**Status:** [ACTIVE/RESOLVED]  
**Reported By:** {agent-id}  
**Reported:** {YYYY-MM-DD HH:MM}  
**Resolved:** {YYYY-MM-DD HH:MM or PENDING}  
**Related Task:** TASK-{NNNN}

---

## Problem Description
{Clear description of the blocker}

## Error Messages
```
{Any error messages or logs}
```

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Attempted Solutions
- [ ] Attempt 1: {Description} - Result: {Outcome}
- [ ] Attempt 2: {Description} - Result: {Outcome}

## Solution
{How the blocker was resolved (if resolved)}

## Prevention
{How to prevent this in the future}
EOF

# Create foreman handoff template
cat > .job-board/05_TEMPLATES/FOREMAN-handoff.md << 'EOF'
[Ver001.000]

# Foreman Handoff

**From:** {outgoing-foreman-id}  
**To:** {incoming-foreman-id}  
**Handoff Time:** {YYYY-MM-DD HH:MM}  
**Shift Duration:** 30 minutes

---

## Active Tasks Summary
| Task ID | Assigned To | Status | Notes |
|---------|-------------|--------|-------|
| TASK-001 | agent-001 | In Progress | 80% complete |
| TASK-002 | agent-002 | Blocked | Waiting on API |

## New Tasks to Create
- [ ] Task 1: {Description}
- [ ] Task 2: {Description}

## Blockers
- BLOCK-001: {Summary}

## Agent Availability
- agent-001: Available
- agent-002: Busy until {time}
- agent-003: Offline

## Notes for Next Foreman
{Important context, warnings, reminders}
EOF
```

**Verification:**
```bash
# Verify templates created
ls -la .job-board/05_TEMPLATES/

# Verify template content
cat .job-board/05_TEMPLATES/TASK-template.md
```

### Step 4: Create Sample Tasks

**Objective:** Populate the ACTIVE listings with initial tasks.

```bash
# Create sample task 1
cat > .job-board/01_LISTINGS/ACTIVE/TASK-0001-setup-test-framework.md << 'EOF'
[Ver001.000]

# Task: Setup Test Framework

**ID:** TASK-0001  
**Priority:** CRITICAL  
**Estimated Duration:** 30 minutes  
**Skill Required:** sator-fastapi-backend  
**Created:** 2026-03-22 15:00  
**Claimed By:** UNCLAIMED  
**Due:** 2026-03-22 16:00

---

## Objective
Set up comprehensive test framework for the FastAPI backend including pytest configuration, fixtures, and initial test cases.

## Acceptance Criteria
- [ ] pytest configured with proper plugins
- [ ] conftest.py with shared fixtures
- [ ] Initial test for health endpoint
- [ ] Test database setup
- [ ] CI integration configured

## Context
The backend currently lacks proper testing infrastructure. We need to establish a foundation for reliable testing before adding new features.

Files to modify:
- `packages/shared/pyproject.toml`
- `packages/shared/tests/conftest.py`
- `tests/unit/test_health.py`

## Dependencies
- [ ] Python 3.11+ installed
- [ ] Virtual environment configured

## Notes
Follow patterns in AGENTS.md for testing conventions.
EOF

# Create sample task 2
cat > .job-board/01_LISTINGS/ACTIVE/TASK-0002-implement-analytics-worker.md << 'EOF'
[Ver001.000]

# Task: Implement SimRating Web Worker

**ID:** TASK-0002  
**Priority:** HIGH  
**Estimated Duration:** 45 minutes  
**Skill Required:** sator-react-frontend  
**Created:** 2026-03-22 15:00  
**Claimed By:** UNCLAIMED  
**Due:** 2026-03-22 16:30

---

## Objective
Implement Web Worker for SimRating calculations to move heavy computations off the main thread.

## Acceptance Criteria
- [ ] Web Worker file created with TypeScript
- [ ] Worker handles CALCULATE and BATCH_CALCULATE messages
- [ ] Progress reporting implemented
- [ ] React hook created for worker communication
- [ ] Error handling in place

## Context
SimRating calculations can be CPU-intensive. Moving them to a Web Worker will improve UI responsiveness.

## Dependencies
- [ ] TASK-0001 completed (for testing)
- [ ] Analytics library finalized

## Notes
Use Vite's worker import syntax for compatibility.
EOF
```

**Verification:**
```bash
ls -la .job-board/01_LISTINGS/ACTIVE/
```

### Step 5: Create Agent Status System

**Objective:** Track agent availability and current work.

```bash
# Create agent status directory
mkdir -p .job-board/.agents

# Create status update script
cat > scripts/update-agent-status.py << 'EOF'
#!/usr/bin/env python3
"""Update agent status in JLB."""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

AGENTS_DIR = Path(".job-board/.agents")


def update_status(agent_id: str, status: str, current_task: str = None):
    """Update agent status file."""
    AGENTS_DIR.mkdir(parents=True, exist_ok=True)
    
    status_file = AGENTS_DIR / f"{agent_id}.json"
    
    data = {
        "agent_id": agent_id,
        "status": status,
        "current_task": current_task,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    
    status_file.write_text(json.dumps(data, indent=2))
    print(f"Updated status for {agent_id}: {status}")


def get_status(agent_id: str = None):
    """Get agent status."""
    if agent_id:
        status_file = AGENTS_DIR / f"{agent_id}.json"
        if status_file.exists():
            print(status_file.read_text())
        else:
            print(f"No status found for {agent_id}")
    else:
        # List all agents
        for status_file in AGENTS_DIR.glob("*.json"):
            print(f"\n=== {status_file.stem} ===")
            print(status_file.read_text())


def main():
    parser = argparse.ArgumentParser(description="Agent Status Manager")
    parser.add_argument("agent_id", nargs="?", help="Agent identifier")
    parser.add_argument("--status", "-s", choices=["available", "busy", "offline"])
    parser.add_argument("--task", "-t", help="Current task ID")
    parser.add_argument("--list", "-l", action="store_true", help="List all agents")
    
    args = parser.parse_args()
    
    if args.list:
        get_status()
    elif args.status:
        update_status(args.agent_id, args.status, args.task)
    elif args.agent_id:
        get_status(args.agent_id)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
EOF

chmod +x scripts/update-agent-status.py
```

**Verification:**
```bash
# Test status update
python scripts/update-agent-status.py agent-001 --status available

# Test status retrieval
python scripts/update-agent-status.py agent-001

# List all agents
python scripts/update-agent-status.py --list
```

### Step 6: Create Foreman Scripts

**Objective:** Automate foreman duties.

```bash
# Create foreman activation script
cat > scripts/foreman-activate.sh << 'EOF'
#!/bin/bash
# Foreman Activation Script

FOREMAN_ID="${1:-$(hostname)}"
LOCK_DIR=".job-board/.locks"
FOREMAN_LOCK="$LOCK_DIR/foreman.lock"

mkdir -p "$LOCK_DIR"

# Check if foreman already active
if [ -f "$FOREMAN_LOCK" ]; then
    CURRENT_FOREMAN=$(cat "$FOREMAN_LOCK" | grep "AGENT:" | cut -d: -f2)
    EXPIRES=$(cat "$FOREMAN_LOCK" | grep "EXPIRES:" | cut -d: -f2)
    echo "ERROR: Foreman $CURRENT_FOREMAN active until $EXPIRES"
    exit 1
fi

# Calculate expiry (30 minutes from now)
if command -v python3 &> /dev/null; then
    EXPIRES=$(python3 -c "from datetime import datetime, timedelta, timezone; print((datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat())")
elif command -v node &> /dev/null; then
    EXPIRES=$(node -e "const d = new Date(); d.setMinutes(d.getMinutes() + 30); console.log(d.toISOString())")
else
    EXPIRES="30 minutes from now"
fi

# Create foreman lock
cat > "$FOREMAN_LOCK" << LOCKFILE
AGENT:$FOREMAN_ID
TIMESTAMP:$(date -Iseconds)
EXPIRES:$EXPIRES
TYPE:foreman
LOCKFILE

echo "======================================"
echo "FOREMAN ACTIVATED: $FOREMAN_ID"
echo "EXPIRES: $EXPIRES"
echo "======================================"
echo ""
echo "Active Tasks:"
ls -la .job-board/02_CLAIMED/*/ 2>/dev/null | grep "TASK-" || echo "  None"
echo ""
echo "Available Tasks:"
ls -la .job-board/01_LISTINGS/ACTIVE/ 2>/dev/null | grep "TASK-" || echo "  None"
EOF

chmod +x scripts/foreman-activate.sh

# Create foreman deactivate script
cat > scripts/foreman-deactivate.sh << 'EOF'
#!/bin/bash
# Foreman Deactivation Script

FOREMAN_ID="${1:-$(hostname)}"
FOREMAN_LOCK=".job-board/.locks/foreman.lock"

if [ ! -f "$FOREMAN_LOCK" ]; then
    echo "ERROR: No active foreman"
    exit 1
fi

CURRENT_FOREMAN=$(cat "$FOREMAN_LOCK" | grep "AGENT:" | cut -d: -f2)

if [ "$CURRENT_FOREMAN" != "$FOREMAN_ID" ]; then
    echo "ERROR: Foreman lock held by $CURRENT_FOREMAN, not $FOREMAN_ID"
    exit 1
fi

rm "$FOREMAN_LOCK"
echo "Foreman $FOREMAN_ID deactivated"
EOF

chmod +x scripts/foreman-deactivate.sh
```

**Verification:**
```bash
# Test foreman activation
./scripts/foreman-activate.sh test-foreman

# Try to activate second foreman (should fail)
./scripts/foreman-activate.sh test-foreman-2 || echo "Expected failure"

# Deactivate
./scripts/foreman-deactivate.sh test-foreman

# Verify released
./scripts/foreman-activate.sh test-foreman-2
./scripts/foreman-deactivate.sh test-foreman-2
```

### Step 7: Create Task Workflow Scripts

**Objective:** Automate task lifecycle.

```bash
# Create task claim script
cat > scripts/task-claim.sh << 'EOF'
#!/bin/bash
# Task Claim Script

AGENT_ID="$1"
TASK_FILE="$2"

if [ -z "$AGENT_ID" ] || [ -z "$TASK_FILE" ]; then
    echo "Usage: $0 <agent-id> <task-file>"
    exit 1
fi

TASK_PATH=".job-board/01_LISTINGS/ACTIVE/$TASK_FILE"
CLAIMED_PATH=".job-board/02_CLAIMED/$AGENT_ID/$TASK_FILE"

if [ ! -f "$TASK_PATH" ]; then
    echo "ERROR: Task not found: $TASK_PATH"
    exit 1
fi

mkdir -p ".job-board/02_CLAIMED/$AGENT_ID"

# Update task file with claim info
sed -i "s/Claimed By: UNCLAIMED/Claimed By: $AGENT_ID/" "$TASK_PATH"
sed -i "s/Claimed:.*$/Claimed: $(date -Iseconds)/" "$TASK_PATH"

# Move to claimed
mv "$TASK_PATH" "$CLAIMED_PATH"

echo "Task claimed: $TASK_FILE -> $AGENT_ID"
EOF

chmod +x scripts/task-claim.sh

# Create task complete script
cat > scripts/task-complete.sh << 'EOF'
#!/bin/bash
# Task Complete Script

AGENT_ID="$1"
TASK_FILE="$2"
SUMMARY="$3"

if [ -z "$AGENT_ID" ] || [ -z "$TASK_FILE" ]; then
    echo "Usage: $0 <agent-id> <task-file> [completion-summary]"
    exit 1
fi

CLAIMED_PATH=".job-board/02_CLAIMED/$AGENT_ID/$TASK_FILE"
COMPLETED_PATH=".job-board/03_COMPLETED/$TASK_FILE"

if [ ! -f "$CLAIMED_PATH" ]; then
    echo "ERROR: Task not found in claimed: $CLAIMED_PATH"
    exit 1
fi

# Update task file with completion info
echo "" >> "$CLAIMED_PATH"
echo "## Completion Summary" >> "$CLAIMED_PATH"
echo "Completed: $(date -Iseconds)" >> "$CLAIMED_PATH"
echo "Completed By: $AGENT_ID" >> "$CLAIMED_PATH"
echo "" >> "$CLAIMED_PATH"
echo "$SUMMARY" >> "$CLAIMED_PATH"

# Move to completed
mkdir -p ".job-board/03_COMPLETED"
mv "$CLAIMED_PATH" "$COMPLETED_PATH"

echo "Task completed: $TASK_FILE"
EOF

chmod +x scripts/task-complete.sh
```

**Verification:**
```bash
# Create a test task
cp .job-board/01_LISTINGS/ACTIVE/TASK-0001-setup-test-framework.md \
   .job-board/01_LISTINGS/ACTIVE/TASK-TEST-claim.md

# Test claim
./scripts/task-claim.sh agent-001 TASK-TEST-claim.md

# Verify claimed
ls .job-board/02_CLAIMED/agent-001/

# Test complete
./scripts/task-complete.sh agent-001 TASK-TEST-claim.md "Test completed successfully"

# Verify completed
ls .job-board/03_COMPLETED/ | grep TASK-TEST
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Lock file stale | Check timestamp; manually remove if old |
| Permission denied | Ensure write access to `.job-board/` |
| Task not found | Check correct path and filename |
| Concurrent modifications | Use lock files for all shared resources |
| Missing templates | Verify `05_TEMPLATES/` exists |
| Agent status not updating | Check `python3` availability |
| Foreman activation fails | Check if another foreman is active |

## Completion Criteria

- [ ] JLB directory structure created
- [ ] Lock file system implemented
- [ ] Task templates created
- [ ] Blocker template created
- [ ] Sample tasks in ACTIVE listings
- [ ] Agent status system working
- [ ] Foreman scripts functional
- [ ] Task lifecycle scripts (claim/complete) working
- [ ] README documentation complete
- [ ] All scripts tested

## JLB Maintenance

### Daily Tasks
- Review and archive completed tasks
- Update agent statuses
- Clear expired locks

### Weekly Tasks
- Archive old blockers
- Review template effectiveness
- Update skill requirements

### Monthly Tasks
- Full JLB audit
- Clean up orphaned files
- Update documentation

## Post-Completion

After completing this playbook:
1. Test full task lifecycle end-to-end
2. Document any issues in `04_BLOCKS/`
3. Update AGENTS.md with JLB info
4. Proceed to Playbook 5: Testing and Deployment
