---
name: sator-coordination
description: "AI Agent Coordination for 4NJZ4 TENET Platform using filesystem-based Job Listing Board (JLB). USE FOR: task claiming, work coordination, file locking, agent communication, foreman scheduling. DO NOT USE FOR: general project management, external coordination tools, non-SATOR projects."
license: MIT
metadata:
  author: SATOR Team
  version: "2.1.0"
---

# SATOR Coordination (Job Listing Board)

> **FILESYSTEM-BASED AGENT COORDINATION**
>
> Location: `.job-board/` (future implementation)
> Simple, effective coordination without external dependencies.
> File locking prevents conflicts. Foreman scheduling prevents collisions.

## Triggers

Activate this skill when user wants to:
- Coordinate work between multiple AI agents
- Implement filesystem-based task management
- Set up file locking patterns for safe collaboration
- Create JLB (Job Listing Board) workflow
- Schedule foreman activations
- Manage agent inbox/claim/completed workflow

## Rules

1. **File Locking** — Always use atomic file operations for locks
2. **Foreman Schedule** — :00 and :30 minutes only, 30-min blocks
3. **One Foreman** — Maximum 1 foreman active at any time
4. **Stale Lock Cleanup** — Locks older than 1 hour are stale
5. **Minimal Overhead** — Filesystem is source of truth
6. **No External Tools** — No Redis, no database, just files

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| Filesystem-based coordination | External tools (Trello, Jira) |
| File locking patterns | Database-based coordination |
| JLB task workflow | Real-time chat coordination |
| Foreman scheduling | Complex orchestration (Airflow) |
| Agent inbox patterns | Human team management |
| Work claiming/assignment | Non-SATOR projects |

## JLB Directory Structure

```
.job-board/
├── 00_INBOX/
│   └── {agent-id}/              # Your incoming tasks
│       └── task-{uuid}.md
├── 01_LISTINGS/
│   ├── ACTIVE/                  # Available tasks
│   │   └── task-{uuid}.md
│   └── ARCHIVED/                # Old listings
├── 02_CLAIMED/
│   └── {agent-id}/              # Your claimed work
│       └── task-{uuid}.md
├── 03_COMPLETED/                # Finished tasks
│   └── task-{uuid}.md
├── 04_BLOCKS/                   # Obstacles & solutions
│   └── block-{uuid}.md
├── 05_TEMPLATES/                # Task templates
│   ├── TEMPLATE_TASK.md
│   └── TEMPLATE_BLOCK.md
└── README.md                    # JLB usage guide
```

## File Locking Pattern

```python
# .agents/skills/sator-coordination/lock_utils.py
import os
import time
import errno
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional

class FileLock:
    """Simple file-based locking for agent coordination."""
    
    def __init__(self, lock_path: str, timeout: int = 3600):
        self.lock_path = Path(lock_path)
        self.timeout = timeout  # 1 hour default
        self._acquired = False
    
    def acquire(self) -> bool:
        """Try to acquire lock. Returns True if successful."""
        try:
            # Create lock atomically with O_EXCL
            fd = os.open(
                self.lock_path,
                os.O_CREAT | os.O_EXCL | os.O_WRONLY
            )
            
            # Write lock metadata
            lock_data = {
                'pid': os.getpid(),
                'timestamp': datetime.utcnow().isoformat(),
                'agent': os.getenv('AGENT_ID', 'unknown')
            }
            
            with os.fdopen(fd, 'w') as f:
                f.write(str(lock_data))
            
            self._acquired = True
            return True
            
        except OSError as e:
            if e.errno == errno.EEXIST:
                # Lock exists - check if stale
                if self._is_stale():
                    self._break_lock()
                    return self.acquire()
                return False
            raise
    
    def release(self) -> None:
        """Release the lock."""
        if self._acquired and self.lock_path.exists():
            self.lock_path.unlink()
            self._acquired = False
    
    def _is_stale(self) -> bool:
        """Check if lock is older than timeout."""
        try:
            mtime = self.lock_path.stat().st_mtime
            lock_time = datetime.fromtimestamp(mtime)
            return datetime.utcnow() - lock_time > timedelta(seconds=self.timeout)
        except OSError:
            return True
    
    def _break_lock(self) -> None:
        """Force remove stale lock."""
        try:
            self.lock_path.unlink()
        except OSError:
            pass
    
    def __enter__(self):
        if not self.acquire():
            raise LockAcquisitionError(f"Could not acquire lock: {self.lock_path}")
        return self
    
    def __exit__(self, *args):
        self.release()
        return False

class LockAcquisitionError(Exception):
    """Failed to acquire file lock."""
    pass
```

## Task File Format

```markdown
---
task_id: "task-abc123"
title: "Implement OPERA Live Events API"
status: "claimed"
priority: "P1"
claimed_by: "agent-alpha"
claimed_at: "2026-03-22T10:00:00Z"
due_at: "2026-03-22T10:30:00Z"
parent_task: null
---

# Implement OPERA Live Events API

## Objective
Create REST endpoints for live tournament events from Pandascore.

## Acceptance Criteria
- [ ] GET /v1/opera/live/events endpoint
- [ ] GET /v1/opera/live/matches endpoint
- [ ] WebSocket /v1/opera/live/ws for real-time updates
- [ ] Tests passing

## Context
See OPERA hub requirements in apps/website-v2/src/hub-4-opera/

## Notes
Use existing PandascoreClient from extraction layer.
```

## Foreman Scheduling

```python
# .agents/skills/sator-coordination/foreman.py
from datetime import datetime, timedelta
from typing import Optional
import os

class ForemanScheduler:
    """
    Schedule foreman activations at :00 and :30.
    Maximum 1 foreman active at any time.
    """
    
    FOREMAN_LOCK = ".job-board/FOREMAN.lock"
    
    @classmethod
    def can_activate(cls) -> bool:
        """Check if this agent can become foreman."""
        now = datetime.utcnow()
        
        # Only activate at :00 or :30
        if now.minute not in [0, 30]:
            return False
        
        # Check if another foreman is active
        lock = FileLock(cls.FOREMAN_LOCK, timeout=1800)  # 30 min
        return lock.acquire()
    
    @classmethod
    def get_privilege_expiry(cls) -> datetime:
        """Get timestamp when foreman privileges expire."""
        now = datetime.utcnow()
        
        if now.minute < 30:
            # Current block ends at :30
            return now.replace(minute=30, second=0, microsecond=0)
        else:
            # Current block ends at next hour
            next_hour = now + timedelta(hours=1)
            return next_hour.replace(minute=0, second=0, microsecond=0)
    
    @classmethod
    def release(cls) -> None:
        """Release foreman privileges."""
        lock = FileLock(cls.FOREMAN_LOCK)
        lock.release()
```

## Workflow Patterns

### Claim a Task

```python
from pathlib import Path
import shutil

def claim_task(task_id: str, agent_id: str) -> bool:
    """Claim a task from ACTIVE listings."""
    
    source = Path(f".job-board/01_LISTINGS/ACTIVE/{task_id}.md")
    target_dir = Path(f".job-board/02_CLAIMED/{agent_id}")
    target = target_dir / f"{task_id}.md"
    
    # Acquire lock on the task
    lock = FileLock(f".job-board/locks/{task_id}.lock")
    
    if not lock.acquire():
        return False  # Someone else claimed it
    
    try:
        if not source.exists():
            return False  # Task gone
        
        # Move to claimed
        target_dir.mkdir(parents=True, exist_ok=True)
        shutil.move(source, target)
        
        # Update status in file
        content = target.read_text()
        content = content.replace("status: available", "status: claimed")
        target.write_text(content)
        
        return True
    finally:
        lock.release()
```

### Complete a Task

```python
def complete_task(task_id: str, agent_id: str) -> bool:
    """Move task to completed."""
    
    source = Path(f".job-board/02_CLAIMED/{agent_id}/{task_id}.md")
    target = Path(f".job-board/03_COMPLETED/{task_id}.md")
    
    if not source.exists():
        return False
    
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(source, target)
    
    return True
```

### Report a Block

```python
def report_block(task_id: str, agent_id: str, description: str) -> str:
    """Report an obstacle."""
    
    block_id = f"block-{uuid.uuid4().hex[:8]}"
    block_path = Path(f".job-board/04_BLOCKS/{block_id}.md")
    
    template = f"""---
block_id: "{block_id}"
task_id: "{task_id}"
reported_by: "{agent_id}"
reported_at: "{datetime.utcnow().isoformat()}"
status: "open"
---

# Block: {description[:50]}

## Description
{description}

## Attempted Solutions
- [ ] 

## Resolution
_TBD_
"""
    
    block_path.parent.mkdir(parents=True, exist_ok=True)
    block_path.write_text(template)
    
    return block_id
```

## Agent Inbox Pattern

```python
class AgentInbox:
    """Simple inbox for agent communication."""
    
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.inbox_path = Path(f".job-board/00_INBOX/{agent_id}")
        self.inbox_path.mkdir(parents=True, exist_ok=True)
    
    def receive(self, message: dict) -> str:
        """Receive a message in inbox."""
        msg_id = f"msg-{uuid.uuid4().hex[:8]}"
        msg_path = self.inbox_path / f"{msg_id}.md"
        
        content = f"""---
message_id: "{msg_id}"
from: "{message['from']}"
to: "{self.agent_id}"
timestamp: "{datetime.utcnow().isoformat()}"
---

{message['content']}
"""
        msg_path.write_text(content)
        return msg_id
    
    def list_unread(self) -> list:
        """List unread messages."""
        return sorted(self.inbox_path.glob("*.md"))
    
    def archive(self, message_id: str) -> None:
        """Archive a read message."""
        source = self.inbox_path / f"{message_id}.md"
        if source.exists():
            target = Path(f".job-board/00_INBOX/_archived/{message_id}.md")
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(source, target)
```

## Commands

```bash
# Check JLB status
cd .job-board && ls -la 01_LISTINGS/ACTIVE/

# Claim a task (manual)
mv .job-board/01_LISTINGS/ACTIVE/task-xxx.md .job-board/02_CLAIMED/{agent-id}/

# View my claimed work
ls .job-board/02_CLAIMED/{agent-id}/

# Complete a task
mv .job-board/02_CLAIMED/{agent-id}/task-xxx.md .job-board/03_COMPLETED/

# Check for blocks
ls .job-board/04_BLOCKS/
```

## Integration with Other Skills

| When | Use Skill |
|------|-----------|
| Task involves data firewall | `sator-data-firewall` |
| Task is API development | `sator-fastapi-backend` |
| Task is frontend work | `sator-react-frontend` |
| Task spans components | `sator-end-to-end` |
| Task needs deployment | `sator-deployment` |

## References

- [AGENTS.md](../../../AGENTS.md) - Project conventions
- [docs/ARCHITECTURE_V2.md](../../../docs/ARCHITECTURE_V2.md) - System design
- [memory/CURRENT_FOCUS.md](../../../memory/CURRENT_FOCUS.md) - Current priorities
