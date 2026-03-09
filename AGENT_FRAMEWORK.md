[Ver009.000]

# Repository Transfer Analysis & Context-Focused Agent Framework

**Date:** March 5, 2026  
**Analysis:** Why the migration was difficult + Proposed agent workflow  
**User Priority:** C > D~B > A (Coordinator → Firewall+Web → Review → Deploy)

---

## Part 1: Why the Transfer Was Difficult

### Root Cause Analysis

#### 1. **Scope Underestimation**
The original assessment treated the migration as a simple file copy operation. However:
- **satorXrotas** had 10 commits of iterative development
- **eSports-EXE** received only 4 consolidated commits
- **Result:** Lost granular context, decision history, and implementation nuances

#### 2. **Subagent Timeout Limitations**
All 6 subagents timed out at 5 minutes:
```
complete-coordinator     5m0s  tokens 27k  STATUS: timeout
complete-frontend        5m0s  tokens 24k  STATUS: timeout  
complete-skills          5m0s  tokens 30k  STATUS: timeout
frontend-implementer     5m0s  tokens 18k  STATUS: timeout
pipeline-implementer     5m0s  tokens 19k  STATUS: timeout
skills-verifier          5m0s  tokens 41k  STATUS: timeout
```

**Impact:**
- Coordinator: Only models created (40% complete)
- Web Components: Directories created but empty (0% complete)
- Skills: Partial documentation, inconsistent structure

#### 3. **Complex Cross-Domain Dependencies**
The project has tight coupling between components:
```
Web Components (React)
    ↓ depends on
Design System (CSS tokens)
    ↓ depends on  
API Schema (TypeScript types)
    ↓ depends on
Pipeline Models (Pydantic)
    ↓ depends on
Database Schema (SQL)
```

**Result:** Subagents couldn't complete because they needed context from other domains.

#### 4. **Documentation vs Implementation Gap**
- **Documentation:** 115 markdown files (extensive)
- **Implementation:** Many features described but not built
- **Example:** Web components have directory structure but no code files

#### 5. **Configuration Fragmentation**
Deployment configs (`render.yaml`, `vercel.json`) existed in original but weren't migrated because:
- They weren't in the "source code" directories
- Subagents focused on `/shared/` and `/website/` only
- Root-level files were overlooked

---

## Part 2: Context-Focused Agent Framework

### The Problem with Previous Approach

**Previous:** "Create the pipeline coordinator"
- Agent had to discover:
  - Existing models
  - Database schema
  - API structure
  - Game client interfaces
  - In ~5 minutes

**Result:** Timeout, partial implementation

### The Solution: Pre-Contextualized Prompts

**New Approach:** Provide complete context upfront
```
Agent receives:
├── Exact file paths of existing code
├── Interfaces/contracts to implement
├── Design system tokens (colors, spacing)
├── Database schema relevant to task
├── API endpoints to integrate with
└── Testing requirements
```

---

## Part 3: Thorough Review Framework

### Phase 0.B: Cross-Repository Context Mining

Before any implementation, the agent should:

#### Step 1: Repository Structure Mapping
```bash
# In satorXrotas (original)
find . -type f -name "*.py" -o -name "*.tsx" -o -name "*.yaml" | sort > original_files.txt

# In eSports-EXE (current)  
find . -type f -name "*.py" -o -name "*.tsx" -o -name "*.yaml" | sort > current_files.txt

# Diff to find missing files
diff original_files.txt current_files.txt > missing_files.txt
```

#### Step 2: Content Comparison
For each missing or modified file:
```python
# Compare implementations
if file_exists_in_both:
    compare_line_count()
    compare_imports()
    compare_function_signatures()
    flag_significant_differences()

if file_missing_in_current:
    classify_priority()  # P0, P1, P2
    identify_dependencies()
    estimate_effort()
```

#### Step 3: Dependency Graph Construction
```
Coordinator (models.py) ─┬─► QueueManager ─┬─► AgentManager (missing)
                         │                  └─► Workers (missing)
                         └─► ConflictResolver (missing)
                              └─► HLTV Client
                              └─► VLR Client
```

#### Step 4: Implementation Order Optimization
Based on dependency graph, determine:
- What can be done in parallel?
- What must be sequential?
- What's blocked by missing dependencies?

---

## Part 4: User-Approved Agent Workflow

### Your Configuration

| Parameter | Your Choice |
|-----------|-------------|
| **Priority Order** | Coordinator (C) → Firewall(D)+Web(B) → Review → Deploy(A) |
| **Concurrency** | Sequential with Paired Parallel |
| **Scope** | Hybrid (structured phases to full) |
| **Review Points** | After each major milestone |

### Workflow Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 0.B: Context Mining (Pre-Implementation)                     │
├─────────────────────────────────────────────────────────────────────┤
│ 1. Compare satorXrotas ↔ eSports-EXE                               │
│ 2. Identify all missing files and their dependencies               │
│ 3. Build complete context package for each P0 task                 │
│ 4. Output: Context dossier for implementation agents               │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ TASK 1: Pipeline Coordinator (Sequential)                          │
├─────────────────────────────────────────────────────────────────────┤
│ • agent_manager.py                                                 │
│ • main.py (orchestrator)                                           │
│ • conflict_resolver.py                                             │
│ • workers/ directory                                               │
│                                                                    │
│ Review Point: Test dual-game extraction before proceeding          │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ TASK 2: Firewall + Web Components (Paired Parallel)                │
├─────────────────────────────────────────────────────────────────────┤
│ AGENT A                    │ AGENT B                               │
│ ───────────────────────────┼───────────────────────────────────────│
│ firewall.py                │ QuarterGrid.tsx                       │
│ GAME_ONLY_FIELDS           │ HubCard.tsx                           │
│ Partition enforcement      │ HelpHub.tsx                           │
│ Request/response filtering │ HealthCheckDashboard.tsx              │
└─────────────────────────────────────────────────────────────────────┘
│ Review Point: Integration test between frontend and API            │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ TASK 3: Mass Review & Sync (Parallel Subagent Check)               │
├─────────────────────────────────────────────────────────────────────┤
│ Multiple agents review:                                            │
│ • Skills system completeness (16 skills)                           │
│ • Documentation accuracy                                           │
│ • Test coverage gaps                                               │
│ • Configuration parity with original                               │
│                                                                    │
│ Output: Sync report with specific files to create/update           │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│ TASK 4: Deployment Configuration (Sequential)                      │
├─────────────────────────────────────────────────────────────────────┤
│ • render.yaml                                                      │
│ • vercel.json                                                      │
│ • docker-compose.yml                                               │
│ • .github/workflows/ci.yml                                         │
│                                                                    │
│ Review Point: Deploy to staging and verify                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Context-Heavy Prompt Template

### Prompt 1: Context Mining Agent

```markdown
## Task: Cross-Repository Context Mining

### Objective
Perform a thorough comparison between the original repository (satorXrotas) 
and current repository (eSports-EXE) to identify gaps and build implementation context.

### Repositories
- **Original:** https://github.com/hvrryh-web/satorXrotas (reference)
- **Current:** /root/.openclaw/workspace/ (working directory)

### Phase 1: File Inventory

1. List all files in current repository:
   ```bash
   find /root/.openclaw/workspace -type f \
     \( -name "*.py" -o -name "*.tsx" -o -name "*.ts" -o -name "*.yaml" \
        -o -name "*.json" -o -name "*.sql" -o -name "*.md" \) \
     | grep -v ".git" | sort
   ```

2. Identify critical missing files by comparing with original repo structure:
   - Deployment configs (render.yaml, vercel.json)
   - Web components (QuarterGrid, HelpHub)
   - Coordinator files (agent_manager, main, workers)
   - API middleware (firewall)
   - CI/CD workflows

### Phase 2: Dependency Mapping

For each P0 component, map dependencies:

**Pipeline Coordinator:**
- Existing: models.py, queue_manager.py
- Missing: agent_manager.py, main.py, conflict_resolver.py, workers/
- Depends on: HLTV client, VLR client, PostgreSQL schema

**QuarterGrid Component:**
- Missing: QuarterGrid.tsx, HubCard.tsx
- Depends on: Porcelain³ design tokens (existing)
- Depends on: Health orchestrator API (existing)

**API Firewall:**
- Missing: firewall.py
- Depends on: FastAPI app structure
- Depends on: Data partition schema

**Deployment Config:**
- Missing: render.yaml, vercel.json, docker-compose.yml
- Depends on: API structure, web app structure

### Phase 3: Context Package Creation

Create a context dossier for each implementation task:

```json
{
  "task": "pipeline_coordinator",
  "existing_files": [
    {
      "path": "shared/axiom-esports-data/pipeline/coordinator/models.py",
      "key_classes": ["JobConfig", "AgentConfig", "BatchResult"],
      "key_enums": ["GameType", "JobStatus", "AgentStatus"]
    }
  ],
  "missing_files": [
    {
      "path": "shared/axiom-esports-data/pipeline/coordinator/agent_manager.py",
      "required_methods": ["register_agent", "assign_work", "health_check"],
      "interfaces": ["AgentManagerInterface"]
    }
  ],
  "dependencies": [
    {
      "type": "database",
      "schema_file": "shared/axiom-esports-data/infrastructure/schema/",
      "relevant_tables": ["extraction_jobs", "extraction_agents"]
    },
    {
      "type": "external_api",
      "client_file": "shared/axiom-esports-data/extraction/src/scrapers/hltv_api_client.py",
      "methods": ["get_match", "get_player_stats"]
    }
  ]
}
```

### Phase 4: Gap Report

Output a comprehensive report:
1. Total files in current repo by type
2. Missing files categorized by priority (P0/P1/P2)
3. Estimated effort for each P0 component
4. Recommended implementation order
5. Potential blockers or dependencies

### Output Files

Create in `/root/.openclaw/workspace/docs/analysis/`:
- `repo_comparison_report.md` - Full comparison analysis
- `context_dossier_coordinator.json` - Context for coordinator task
- `context_dossier_webcomponents.json` - Context for web components task
- `context_dossier_firewall.json` - Context for firewall task
- `context_dossier_deployment.json` - Context for deployment task

### Constraints
- Do NOT modify any existing files
- Do NOT create implementation files (only context/analysis)
- Focus on completeness of analysis
```

---

### Prompt 2: Pipeline Coordinator Implementation

```markdown
## Task: Complete Pipeline Coordinator Implementation

### Context (Pre-Provided - Do Not Re-Discover)

**Existing Files (Read Only):**
1. `shared/axiom-esports-data/pipeline/coordinator/models.py` (550 lines)
   - Classes: JobConfig, AgentConfig, BatchResult, JobPriority, GameType
   - Status enums: JobStatus, AgentStatus
   - Pydantic v2 models with validation

2. `shared/axiom-esports-data/pipeline/coordinator/queue_manager.py` (500 lines)
   - Class: QueueManager
   - Methods: add_job(), get_next_job(), complete_job(), fail_job()
   - Priority queue with age-based escalation

3. `shared/axiom-esports-data/extraction/src/scrapers/hltv_api_client.py`
   - HLTV scraping for CS2
   - Methods: get_match(match_id), get_player_stats(player_id)

4. `shared/axiom-esports-data/extraction/src/scrapers/vlr_resilient_client.py`
   - VLR.gg scraping for Valorant
   - Circuit breaker pattern implemented

5. Database Schema: `shared/axiom-esports-data/infrastructure/schema/`
   - Tables: extraction_jobs, extraction_agents, batches

**Missing Files (Create These):**

### File 1: agent_manager.py

Location: `shared/axiom-esports-data/pipeline/coordinator/agent_manager.py`

Requirements:
```python
class AgentManager:
    """Manages extraction agent lifecycle and work assignment."""
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool
        self.agents: Dict[str, AgentConfig] = {}
    
    async def register_agent(self, agent_config: AgentConfig) -> str:
        """Register a new extraction agent."""
        # Insert to database, return agent_id
    
    async def assign_work(self, agent_id: str) -> Optional[JobConfig]:
        """Assign next job to agent based on capabilities."""
        # Check agent.game_type (cs/valorant)
        # Get job from queue_manager
        # Update job status to ASSIGNED
    
    async def heartbeat(self, agent_id: str) -> bool:
        """Process agent heartbeat, return True if agent healthy."""
        # Update last_seen timestamp
        # Check if agent missed heartbeats
    
    async def mark_busy(self, agent_id: str, job_id: str):
        """Mark agent as busy with specific job."""
    
    async def mark_idle(self, agent_id: str):
        """Mark agent as idle after job completion."""
    
    async def deregister_agent(self, agent_id: str):
        """Remove agent from active pool."""
```

### File 2: main.py (Orchestrator)

Location: `shared/axiom-esports-data/pipeline/coordinator/main.py`

Requirements:
```python
from fastapi import FastAPI, BackgroundTasks
from .models import JobConfig, AgentConfig
from .queue_manager import QueueManager
from .agent_manager import AgentManager

app = FastAPI(title="SATOR Pipeline Coordinator")

@app.post("/jobs/submit")
async def submit_job(job: JobConfig) -> dict:
    """Submit a new extraction job."""

@app.get("/jobs/{job_id}/status")
async def get_job_status(job_id: str) -> dict:
    """Get job status and results."""

@app.post("/agents/register")
async def register_agent(agent: AgentConfig) -> dict:
    """Register a new extraction agent."""

@app.post("/agents/{agent_id}/heartbeat")
async def agent_heartbeat(agent_id: str) -> dict:
    """Process agent heartbeat."""

@app.get("/agents/{agent_id}/work")
async def get_work(agent_id: str) -> Optional[JobConfig]:
    """Get next work assignment for agent."""

@app.post("/jobs/{job_id}/complete")
async def complete_job(job_id: str, result: BatchResult) -> dict:
    """Mark job as complete with results."""

# Background task for job scheduling
async def scheduler_loop():
    """Main scheduling loop running in background."""
```

### File 3: conflict_resolver.py

Location: `shared/axiom-esports-data/pipeline/coordinator/conflict_resolver.py`

Requirements:
```pythonnclass ConflictResolver:
    """Handles duplicate detection and content drift."""
    
    async def check_duplicate(self, job: JobConfig) -> Optional[str]:
        """Check if job duplicates existing/pending work."""
        # Hash match_id + game_type
        # Return existing job_id if duplicate
    
    async def detect_drift(self, old_data: dict, new_data: dict) -> dict:
        """Detect content drift between old and new extraction."""
        # Return diff report
    
    async def resolve_conflict(self, job_id1: str, job_id2: str) -> str:
        """Resolve conflict between competing jobs."""
        # Priority-based resolution
```

### File 4: workers/base_worker.py

Location: `shared/axiom-esports-data/pipeline/coordinator/workers/base_worker.py`

Requirements:
```python
from abc import ABC, abstractmethod
from ..models import JobConfig, BatchResult

class BaseExtractionWorker(ABC):
    """Abstract base class for game extraction workers."""
    
    def __init__(self, agent_id: str, coordinator_url: str):
        self.agent_id = agent_id
        self.coordinator_url = coordinator_url
        self.game_type: GameType = None  # Override in subclass
    
    async def run(self):
        """Main worker loop."""
        # Register with coordinator
        # Heartbeat loop
        # Work fetch → Process → Report
    
    @abstractmethod
    async def extract(self, job: JobConfig) -> BatchResult:
        """Perform extraction. Override in subclass."""
        pass
    
    async def report_heartbeat(self):
        """Send heartbeat to coordinator."""
    
    async def fetch_work(self) -> Optional[JobConfig]:
        """Fetch next job from coordinator."""
```

### File 5: workers/cs2_worker.py

Location: `shared/axiom-esports-data/pipeline/coordinator/workers/cs2_worker.py`

Requirements:
```python
from .base_worker import BaseExtractionWorker
from ...scrapers.hltv_api_client import HLTVClient

class CS2ExtractionWorker(BaseExtractionWorker):
    """CS2 extraction worker using HLTV."""
    
    def __init__(self, agent_id: str, coordinator_url: str):
        super().__init__(agent_id, coordinator_url)
        self.game_type = GameType.CS
        self.client = HLTVClient()
    
    async def extract(self, job: JobConfig) -> BatchResult:
        """Extract CS2 match data from HLTV."""
        # Use HLTV client
        # Transform to RAWS schema
        # Return BatchResult
```

### File 6: workers/valorant_worker.py

Location: `shared/axiom-esports-data/pipeline/coordinator/workers/valorant_worker.py`

Requirements:
```python
from .base_worker import BaseExtractionWorker
from ...scrapers.vlr_resilient_client import VLRClient

class ValorantExtractionWorker(BaseExtractionWorker):
    """Valorant extraction worker using VLR."""
    
    def __init__(self, agent_id: str, coordinator_url: str):
        super().__init__(agent_id, coordinator_url)
        self.game_type = GameType.VALORANT
        self.client = VLRClient()
    
    async def extract(self, job: JobConfig) -> BatchResult:
        """Extract Valorant match data from VLR."""
        # Use VLR client
        # Transform to RAWS schema
        # Return BatchResult
```

### Testing Requirements

Create `shared/axiom-esports-data/pipeline/coordinator/tests/`:
- `test_agent_manager.py` - Test agent lifecycle
- `test_main.py` - Test API endpoints
- `test_conflict_resolver.py` - Test duplicate detection
- `test_workers.py` - Test worker implementations

### Integration Points

1. **Database:** Use asyncpg, schema already defined
2. **Queue:** Integrate with existing QueueManager
3. **Clients:** Use existing HLTV and VLR clients
4. **Models:** Use existing Pydantic models

### Constraints
- Must use existing models.py (no modifications)
- Must use existing queue_manager.py (no modifications)
- Python 3.11+ with type hints
- Async/await throughout
- Pydantic v2 for validation

### Output

1. Create all 6 files listed above
2. Ensure all imports resolve
3. Add type hints throughout
4. Create test files
5. Verify with: `python -c "from coordinator.main import app; print('OK')"`
```

---

## Part 6: Hybrid Phased Implementation Plan

### Phase 0.B: Context Mining (Days 1-2)
**Goal:** Complete understanding before building
- Compare repositories
- Map dependencies
- Create context dossiers
- **Review Point:** Approve context accuracy

### Phase 1: Coordinator (Days 3-6)
**Goal:** Backend foundation operational
- Agent manager
- Orchestrator API
- Conflict resolver
- Worker implementations
- **Review Point:** Test dual-game extraction

### Phase 2: Paired Parallel (Days 7-12)
**Goal:** Frontend + Security

**Track A - Firewall (Agent D):**
- Day 7-8: Core middleware
- Day 9: GAME_ONLY_FIELDS
- Day 10: Partition enforcement
- Day 11-12: Testing

**Track B - Web Components (Agent B):**
- Day 7-8: QuarterGrid component
- Day 9-10: HubCard + ServiceSelection
- Day 11-12: HelpHub + HealthDashboard

**Review Point:** Integration test

### Phase 3: Mass Review (Days 13-16)
**Goal:** Sync with original repository
- Skills system audit
- Documentation review
- Test coverage analysis
- Configuration parity check
- **Review Point:** Sync report approval

### Phase 4: Deployment (Days 17-19)
**Goal:** Production-ready configuration
- render.yaml
- vercel.json
- docker-compose.yml
- CI/CD workflows
- **Review Point:** Staging deployment

### Phase 5: Full Implementation Polish (Days 20-30)
**Goal:** Complete all features to spec
- Advanced coordinator features
- Web component polish
- Complete testing
- Documentation updates

---

## Summary

**Why transfer was difficult:**
1. Scope underestimated (10 commits → 4)
2. Subagent timeouts (5min limit)
3. Complex cross-domain dependencies
4. Documentation/implementation gap
5. Configuration fragmentation

**How we fix it:**
1. Pre-contextualized prompts (no discovery needed)
2. Sequential with paired parallel (your choice)
3. Mass review before final deployment
4. Hybrid approach (structured phases)

**Ready to proceed?** Confirm and I'll send the Context Mining agent prompt first.