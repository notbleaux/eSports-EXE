[Ver1.1.0]

# AI AGENT REGISTRY
## Libre-X-eSport 4NJZ4 TENET Platform
### Master Registry of Active and Archived Agents

**Classification:** Internal Use  
**Authority:** AI Coordination Team  
**Last Updated:** 2026-03-17

---

## I. REGISTRY OVERVIEW

### 1.1 Active Agents

| Agent ID | Name | Classification | Status | Owner | Last Active |
|----------|------|----------------|--------|-------|-------------|
| sator-kimi-cli-001 | Kimi Code CLI Agent | manual | operational | user-terminal | 2026-03-17 |
| sator-vscode-001 | VS Code IDE Agent | supervised | operational | vscode-extension | 2026-03-17 |
| sator-openclaw-001 | Open-Claw Cloud Agent | automated | operational | cloud-scheduler | 2026-03-17 |

### 1.2 Archived Agents

| Agent ID | Name | Archived Date | Reason | Archive Location |
|----------|------|---------------|--------|------------------|
| *No archived agents* | | | | |

### 1.3 Pending Approval

| Agent ID | Name | Submitted | Reviewer | Status |
|----------|------|-----------|----------|--------|
| *No pending registrations* | | | | |

---

## II. AGENT COORDINATION MATRIX

### 2.1 Agent Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENT COORDINATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐         ┌──────────────┐                │
│   │  Kimi CLI    │◄───────►│  VS Code     │                │
│   │  (Terminal)  │  ACP    │  (IDE)       │                │
│   └──────┬───────┘         └──────┬───────┘                │
│          │                        │                         │
│          │    ┌──────────────┐    │                         │
│          └───►│   Job Board  │◄───┘                         │
│               │   (JLB)      │                              │
│               └──────┬───────┘                              │
│                      │                                      │
│               ┌──────▼───────┐                              │
│               │ Open-Claw    │                              │
│               │ (Cloud)      │                              │
│               └──────────────┘                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Communication Channels

| Channel | Location | Members | Purpose |
|---------|----------|---------|---------|
| **Broadcast** | `.agents/channels/broadcast/` | All agents | Urgent messages, announcements |
| **CLI Team** | `.agents/channels/cli-team/` | Kimi CLI | Terminal-based coordination |
| **IDE Team** | `.agents/channels/ide-team/` | VS Code Agent | Editor-based coordination |
| **Cloud Team** | `.agents/channels/cloud-team/` | Open-Claw | Cloud-based coordination |

### 2.3 Conflict Resolution Priority

1. **File Locking** - First to lock wins
2. **JLB Protocol** - Task ownership via Job Board
3. **Foreman Override** - 30-minute arbitration window
4. **Human Decision** - Final escalation

---

## III. REGISTRATION PROCEDURES

### 3.1 New Agent Registration

1. **Create Manifest** using template in `templates/agent-manifest.template.json`
2. **Validate** with: `npm run validate-agent -- --manifest=./manifest.json`
3. **Submit** via PR to add entry to Pending Approval table
4. **Await Review** by AI Coordinator
5. **Upon Approval** move to Active Agents table

### 3.2 Agent Status Changes

**Activation:**
```markdown
- Move from "Pending Approval" to "Active Agents"
- Set Status to "operational"
- Record activation timestamp
- Assign agent workspace in `.agents/active/{agent-id}/`
```

**Suspension:**
```markdown
- Set Status to "suspended"
- Record reason and duration
- Release all file locks
- Notify collaborators
```

**Archival:**
```markdown
- Move from "Active Agents" to "Archived Agents"
- Move workspace to `.agents/archive/{agent-id}/`
- Record archival reason
- Preserve audit trail
```

---

## IV. AGENT WORKSPACE STRUCTURE

Each active agent receives a workspace:

```
.agents/active/{agent-id}/
├── manifest.json           # Copy of approved manifest
├── current-task.json       # Active task tracking
├── locks/                  # File locks held
├── messages/               # Incoming/outgoing messages
└── history/                # Completed tasks archive
```

---

## V. COMPLIANCE AUDIT LOG

| Date | Action | Agent ID | Authorized By | Notes |
|------|--------|----------|---------------|-------|
| 2026-03-13 | Registry Created | N/A | System | Initial setup |
| 2026-03-17 | Agent Registered | sator-kimi-cli-001 | user | CLI agent activated |
| 2026-03-17 | Agent Registered | sator-vscode-001 | user | VS Code agent activated |
| 2026-03-17 | Agent Registered | sator-openclaw-001 | user | Cloud agent activated |

---

## VI. GOVERNANCE

### 6.1 Review Schedule

- **Daily:** Active agent activity verification
- **Weekly:** Compliance audit
- **Monthly:** Registry maintenance and cleanup
- **Quarterly:** Full governance review

### 6.2 Change Control

All modifications to this registry require:
1. PR with justification
2. AI Coordinator review
3. Approval from Tech Lead
4. Audit log entry

---

## VII. QUICK REFERENCE

### 7.1 Agent Capabilities Summary

| Agent | Type | Best For | Avoid |
|-------|------|----------|-------|
| **Kimi CLI** | Terminal | Full-stack, complex tasks, coordination | GUI work, quick edits |
| **VS Code** | IDE | Inline editing, refactoring, debugging | Large architecture changes |
| **Open-Claw** | Cloud | Scheduled tasks, data processing, monitoring | Interactive work, UI changes |

### 7.2 Task Assignment Guidelines

- **Quick fixes** → VS Code Agent
- **Architecture/Complex** → Kimi CLI
- **Data/Reporting** → Open-Claw Cloud
- **Conflicts** → JLB Foreman protocol

---

**Document Control:**
- Version: 1.1.0
- Owner: AI Coordination Team
- Review Cycle: Weekly
- Distribution: Internal

*End of Agent Registry*
