# IMPLEMENTATION PLAN
## Post-CRIT Refinements + Prior Request Integration

**Plan ID:** PLN-IMPL-001  
**Version:** [Ver001.000]  
**Date:** March 9, 2026  
**Status:** IN PROGRESS

---

## PHASE 1: CRIT RECOMMENDATIONS IMPLEMENTATION

### 1.1 CRIT Report #2 - Improvement #1: Missing Templates (CRITICAL)

| Template | Status | Location |
|----------|--------|----------|
| AGENT_REGISTRY.md | ❌ MISSING | `06_META/AGENT_REGISTRY.md` |
| HANDOFF_FORM.md | ❌ MISSING | `05_TEMPLATES/HANDOFF_FORM.md` |
| VERIFICATION_CHECKLIST.md | ❌ MISSING | `05_TEMPLATES/VERIFICATION_CHECKLIST.md` |
| STATUS_UPDATE_TEMPLATE.md | ❌ MISSING | `05_TEMPLATES/STATUS_UPDATE_TEMPLATE.md` |
| BLOCKER_REPORT_TEMPLATE.md | ❌ MISSING | `05_TEMPLATES/BLOCKER_REPORT_TEMPLATE.md` |

**Action:** Create all 5 missing templates with full specifications.

### 1.2 CRIT Report #2 - Improvement #2: Concurrency Control (CRITICAL)

**Components:**
1. Update TASK_SCHEMA.json with claim token mechanism
2. Define claim protocol documentation
3. Document conflict resolution rules
4. Create example scenarios

### 1.3 CRIT Report #2 - Improvement #3: Timeout/Recovery (HIGH)

**Components:**
1. Create TIMEOUT_CONFIG.json
2. Define stale task detection protocol
3. Document orphan recovery procedures
4. Create STALE-{task-id}.md template

---

## PHASE 2: FOREMAN ROLE SPECIFICATION

### 2.1 Foreman Activation Protocol

**Activation Schedule:**
- **On the hour** (00:00, 01:00, 02:00, etc.)
- **On the half-hour** (00:30, 01:30, 02:30, etc.)
- **Duration:** Exactly 30 minutes per activation

**Constraints:**
- **Maximum 1 foreman active at any time**
- **No foreman overlap permitted**
- **Foreman privileges EXPIRE after 30 minutes**
- **No extension mechanism**

### 2.2 Foreman Privileges (Active During 30-Minute Block ONLY)

| Privilege | Description | Restriction |
|-----------|-------------|-------------|
| **Context Update** | Modify task context files | Only during active block |
| **Job Reassignment** | Reassign tasks between agents | Requires justification log |
| **Priority Override** | Change task priorities | Documented in reason field |
| **Block Resolution** | Resolve BLOCKED tasks | Only with agent consent |
| **Emergency Override** | Bypass normal protocols | CRITICAL only, logged |

### 2.3 Security Guidelines for Foreman Role

1. **Authentication:** Foreman must identify in commit messages: `[JLB-FOREMAN]`
2. **Logging:** All foreman actions logged to `07_LOGS/FOREMAN_ACTIONS/`
3. **Audit Trail:** Every modification requires reason documentation
4. **Rate Limiting:** Max 1 foreman activation per agent per 4 hours
5. **Termination:** Foreman can be revoked by majority agent vote (logged)

### 2.4 30-Minute Check-In Protocol

**Scheduled Checks:**
- Every :00 and :30 mark
- Check `00_INBOX/` for all agents
- Check `01_LISTINGS/` for stale tasks (>24h)
- Check `02_CLAIMED/*/BLOCKED/` for resolution opportunities
- Check `03_COMPLETED/*/PENDING_REVIEW/` for verification backlog

**Action Required:**
- Update `06_META/LAST_CHECK_TIMESTAMP`
- Log findings to `07_LOGS/AGENT_STATUS_LOG.md`
- Create BROADCAST if system-wide issues detected

---

## PHASE 3: COMPETITOR ANALYSIS JOBS (From Prior Request)

### Job 1: eSports Analytics Competitor Research
**Task ID:** JOB-001  
**Priority:** HIGH  
**Type:** RESEARCH  
**Description:** Research and document eSports analytics competitors including:
- Pro-Football-Reference style sites (HLTV.org, VLR.gg, etc.)
- Advanced analytics platforms (PFF-style for esports)
- Statistical reference services
- Information hubs and aggregators

**Deliverables:**
- Competitor analysis report (markdown)
- Feature comparison matrix
- API availability assessment
- Partnership opportunity notes

### Job 2: Riot Games API Research
**Task ID:** JOB-002  
**Priority:** HIGH  
**Type:** RESEARCH  
**Description:** Research Riot Games API for Valorant data:
- Developer portal access requirements
- API endpoints available
- Rate limits and pricing
- Data coverage and latency
- Application process for production access

**Deliverables:**
- Riot API documentation summary
- Access application template
- Integration architecture notes
- Sample API responses

### Job 3: Valve API Research (CS2)
**Task ID:** JOB-003  
**Priority:** HIGH  
**Type:** RESEARCH  
**Description:** Research Valve/Steam APIs for Counter-Strike 2 data:
- Steam Web API capabilities
- CS2 Game State Integration
- Third-party data sources (HLTV, etc.)
- Community data access options

**Deliverables:**
- Valve API capabilities report
- CS2 data access strategy
- Alternative data source documentation
- Integration recommendations

---

## PHASE 4: FILE STRUCTURE & NAMING CONVENTIONS AUDIT

### Job 4: Repository Structure Assessment
**Task ID:** JOB-004  
**Priority:** MEDIUM  
**Type:** ANALYSIS  
**Description:** Comprehensive audit of file structure and naming conventions:
- Assess current organization (12 directories)
- Evaluate naming consistency
- Identify duplicate/conflicting files
- Review legacy vs. active file separation
- Map service relationships

**Deliverables:**
- File structure assessment report
- Naming convention recommendations
- Refactoring plan (if needed)
- Service relationship diagram

**Notes (up to 20 bullet points):**
- Visual themes: NJZ (void/signal/amber), Porcelain³ (white/blue/gold), Hybrid
- Naming motifs: SATOR/ROTAS palindrome, esoteric geometry, twin-file integrity
- Design patterns: Holographic UI, animated grids, smoke atmospheres
- Service boundaries: RAWS (static), BASE (analytics), eXe (directory), ROTAS (platform)

---

## PHASE 5: USER EXPERIENCE FRAMEWORK

### Job 5: User Profile Framework Development
**Task ID:** JOB-005  
**Priority:** HIGH  
**Type:** DESIGN  
**Description:** Create comprehensive user experience framework:

**User Profiles to Define:**
1. **Casual** — Occasional visitor, basic stats interest
2. **Super Fan** — Deep engagement, all features
3. **Traditional** — Prefers conventional sports reference style
4. **Average** — Moderate engagement, typical use
5. **Niche** — Specific interest areas, deep dives
6. **Gamer (non-CS/Val)** — Gaming background, different games
7. **Gamer (CS/Val player)** — Active player, practical application

**3-Step Check for Each Profile:**
- **(1) First Impressions:** Initial landing experience
- **(2) Experience Grounding:** Navigation and feature discovery
- **(3) Post Use:** Retention and return behavior

**Deliverables:**
- User profile definitions (7 profiles)
- 3-step check framework
- Decision value metrics
- Comparison to competitor UX
- Visual design system documentation

---

## PHASE 6: DOCUMENTATION UPDATES

### 6.1 Update Main Repository README

**Additions Required:**
- Job Listing Board section
- Link to `.job-board/README.md`
- Foreman role mention
- Agent coordination guidelines

### 6.2 Update JLB README with Foreman Specifications

**Additions Required:**
- Foreman activation schedule (:00 and :30)
- 30-minute duration limit
- Privileges and restrictions
- Security guidelines
- 30-minute check-in protocol
- Foreman action logging requirements

### 6.3 Create AGENT_ONBOARDING_GUIDE.md

**Content:**
- How to discover the JLB
- How to claim agent identity
- How to check for tasks
- How to report status
- How to request help
- Foreman interaction guidelines

---

## IMPLEMENTATION SEQUENCE

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| 1 | Create missing templates | 2 hours | None |
| 2 | Foreman specifications | 1 hour | Phase 1 |
| 3 | Competitor analysis jobs | 30 min setup | Phase 2 |
| 4 | File structure audit | 30 min setup | Phase 2 |
| 5 | UX framework job | 30 min setup | Phase 2 |
| 6 | Documentation updates | 1 hour | Phase 2 |

**Total Estimated Time:** 5.5 hours  
**Parallel Execution:** Phases 3, 4, 5 can run concurrently after Phase 2

---

## VERIFICATION CHECKLIST

- [ ] All 5 missing templates created
- [ ] TASK_SCHEMA.json updated with claim token
- [ ] TIMEOUT_CONFIG.json created
- [ ] Foreman specifications documented
- [ ] Security guidelines added
- [ ] 30-minute check-in protocol defined
- [ ] Main README updated with JLB reference
- [ ] JLB README updated with foreman details
- [ ] Agent onboarding guide created
- [ ] Jobs 1-5 created in `01_LISTINGS/ACTIVE/HIGH/`
- [ ] All files committed with `[JLB]` messages

---

**Plan Created:** March 9, 2026 06:20  
**Ready for Implementation:** YES

---

*This plan addresses all CRIT recommendations and prior user requests.*