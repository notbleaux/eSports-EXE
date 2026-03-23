[Ver001.000]

# FRAMEWORK
## JLB Protocols, Standards, and Tools

**Purpose:** Central repository for all JLB operational frameworks

---

## Contents

### Protocols
- **ASYNC_CONSOLIDATION_PROTOCOL_v2.md** - Async agent consolidation procedures
- **JOB_CLAIMING_PROTOCOL_v2.md** - Job claiming and reporting standards
- **ASYNC_CONSOLIDATION_PROTOCOL.md** - Legacy protocol (archived)

### Standards
- **NAMING_CONVENTION.md** - File and directory naming standards

### Tools
- **VERIFICATION_SCRIPTS/** - Python verification tools
  - verify_consolidation.py
  - generate_manifest.py
  - deduplicate.py

### Architecture
- **ARCHITECTURE_DESIGN.md** - JLB system architecture
- **MULTI_AI_COORD_GUIDELINES.md** - Multi-agent coordination

---

## Usage

All agents should reference these frameworks when:
- Claiming tasks (see JOB_CLAIMING_PROTOCOL_v2.md)
- Completing work (see NAMING_CONVENTION.md)
- Running consolidation (see ASYNC_CONSOLIDATION_PROTOCOL_v2.md)

---

*Part of JLB v2.0*
