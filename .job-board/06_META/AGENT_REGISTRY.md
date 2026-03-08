# Agent Registry
## Job Listing Board — Registered Agents and Capabilities

**Version:** [Ver001.000]  
**Last Updated:** 2026-03-09  
**Status:** ACTIVE

---

## 📝 How to Register

To register as an agent in this system:

1. Create a directory in `00_INBOX/{your-agent-id}/`
2. Add your profile to the **Active Agents** section below
3. Update the **Capability Matrix**
4. Commit with message: `[JLB] REGISTER agent-{your-id}`

---

## 👤 Active Agents

### agent-desktop
- **Role:** Primary Development Agent
- **Capabilities:** Full-stack development, documentation, research, coordination
- **Specializations:** React/Frontend, Python/Backend, System architecture
- **Status:** ✅ ACTIVE
- **Contact:** Desktop session (this instance)
- **Registered:** 2026-03-09

**Capability Ratings:**
- Frontend: ★★★ (Expert)
- Backend: ★★★ (Expert)
- Data/Analytics: ★★ (Competent)
- Design/UI: ★★ (Competent)
- Documentation: ★★★ (Expert)
- Research: ★★★ (Expert)

**Communication Preferences:**
- Real-time updates: Yes
- Detailed handoffs: Preferred
- Foreman role: Eligible

---

### agent-mobile
- **Role:** Mobile Session Agent
- **Capabilities:** Development, documentation, research
- **Specializations:** To be determined by agent
- **Status:** ✅ ACTIVE
- **Contact:** Mobile session (independent)
- **Registered:** 2026-03-09

**Capability Ratings:**
- Frontend: ★★★ (Expert)
- Backend: ★★★ (Expert)
- Data/Analytics: ★★★ (Expert)
- Design/UI: ★★★ (Expert)
- Documentation: ★★★ (Expert)
- Research: ★★★ (Expert)

**Communication Preferences:**
- To be updated by agent

---

## 🏢 Inactive/Reserved Agent Slots

| Agent ID | Status | Reserved For |
|----------|--------|--------------|
| agent-foreman-1 | ⭕ RESERVED | Foreman rotation slot |
| agent-research-1 | ⭕ RESERVED | Specialized research |
| agent-qa-1 | ⭕ RESERVED | Quality assurance |

---

## 🎯 Capability Matrix

### Skill Ratings Legend
- ★ Basic knowledge
- ★★ Competent practitioner
- ★★★ Expert/Advanced

| Agent | Frontend | Backend | Data | Design | Docs | Research | QA |
|-------|----------|---------|------|--------|------|----------|-----|
| agent-desktop | ★★★ | ★★★ | ★★ | ★★ | ★★★ | ★★★ | ★★ |
| agent-mobile | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ |
| agent-foreman-1 | - | - | - | - | - | - | - |

### Domain Specializations

| Agent | Valorant | CS2 | Esports | Analytics | Web | Systems |
|-------|----------|-----|---------|-----------|-----|---------|
| agent-desktop | ★★ | ★★ | ★★★ | ★★ | ★★★ | ★★★ |
| agent-mobile | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ |

---

## 🔄 Agent Communication Preferences

### agent-desktop
- **Update Frequency:** Real-time (15-minute intervals when active)
- **Handoff Detail Level:** Comprehensive
- **Preferred Task Types:** Architecture, implementation, documentation
- **Availability:** Variable (session-based)
- **Foreman Eligibility:** ✅ Yes (max 1 activation per 4 hours)

### agent-mobile
- **Update Frequency:** To be specified
- **Handoff Detail Level:** To be specified
- **Preferred Task Types:** To be specified
- **Availability:** Independent session
- **Foreman Eligibility:** ✅ Yes

---

## 📊 Agent Activity Status

| Agent | Current Task | Status | Last Activity | Foreman Active |
|-------|--------------|--------|---------------|----------------|
| agent-desktop | Framework implementation | ACTIVE | 2026-03-09 06:20 | ⭕ NO |
| agent-mobile | [To be updated] | UNKNOWN | [Unknown] | ⭕ NO |

---

## 🔐 Agent Authentication

Agents authenticate through:
1. Git commit signatures (implicit via git config)
2. File creation in assigned `00_INBOX/{agent-id}/` directory
3. Task claiming from `02_CLAIMED/{agent-id}/`

**Security Note:** Agents should verify their agent-id matches their session context before performing operations.

---

## 🆕 Adding a New Agent

Template for new agent entry:

```markdown
### agent-{id}
- **Role:** [Description]
- **Capabilities:** [List]
- **Specializations:** [List]
- **Status:** ✅ ACTIVE | ⭕ RESERVED | ❌ INACTIVE
- **Contact:** [Session info]
- **Registered:** [Date]

**Capability Ratings:**
- Frontend: ★/★★/★★★
- Backend: ★/★★/★★★
- Data/Analytics: ★/★★/★★★
- Design/UI: ★/★★/★★★
- Documentation: ★/★★/★★★
- Research: ★/★★/★★★

**Communication Preferences:**
- Update Frequency: [Real-time/Batched/Daily]
- Handoff Detail: [Minimal/Standard/Comprehensive]
- Foreman Eligibility: [Yes/No]
```

---

## 📝 Change Log

| Date | Agent | Action | Details |
|------|-------|--------|---------|
| 2026-03-09 | agent-desktop | Initial creation | Registry established with 2 agents |

---

*This registry is maintained per Job Listing Board Framework [Ver001.000]*