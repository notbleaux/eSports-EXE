# Refined Form Structure & Schema
## Minimap Recording + Archival System Diagram Generation Job

Based on mock verification findings, this formal structure standardizes and automates the diagram generation job.

---

## 1. High-Level Form Structure

```
Job Metadata
├── Context & Domain Description
├── Schedule & Agent Info
├── Diagram Task Specification
├── Validation & Quality Checklist
├── Output Structure
├── Success Criteria & Review Notes
└── Run Report (filled during execution)
```

---

## 2. JSON Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "minimap-archival-diagram-job",
  "title": "Minimap Recording + Archival Diagram Generation Job",
  "type": "object",
  "required": [
    "jobMetadata",
    "context",
    "schedule",
    "diagramTask",
    "validationChecklist",
    "outputFormat",
    "successCriteria"
  ],
  "properties": {
    "jobMetadata": {
      "type": "object",
      "properties": {
        "jobId": {
          "type": "string",
          "pattern": "^[A-Z]{2}-[A-Z]+-DIAGRAMS-[0-9]{3}$",
          "description": "Unique job identifier"
        },
        "jobName": {
          "type": "string",
          "description": "Human-readable job name"
        },
        "createdBy": {
          "type": "string",
          "enum": ["manual-orchestrator", "scheduled-agent", "system"]
        },
        "createdAt": {
          "type": "string",
          "format": "date-time"
        },
        "version": {
          "type": "string",
          "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
        }
      },
      "required": ["jobId", "jobName", "createdBy", "createdAt", "version"]
    },
    "context": {
      "type": "object",
      "properties": {
        "domain": {
          "type": "string",
          "enum": ["minimap-recording-and-archival"]
        },
        "description": {
          "type": "string",
          "maxLength": 500
        },
        "features": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "Minimap recording (start/stop, event capture, state capture)",
              "Archival storage (integrity, indexing, retention)",
              "Playback from archives (reconstruct minimap state)"
            ]
          },
          "minItems": 3
        },
        "constraints": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "Use mermaid syntax only",
              "All labels in quotes",
              "No nested code fences or images",
              "No generic service names",
              "Must show all three flows: recording, archival, playback"
            ]
          }
        }
      },
      "required": ["domain", "description", "features", "constraints"]
    },
    "schedule": {
      "type": "object",
      "properties": {
        "scheduleId": {
          "type": "string",
          "pattern": "^REVIEW-[0-9]{8}$"
        },
        "startDate": {
          "type": "string",
          "format": "date"
        },
        "endDate": {
          "type": "string",
          "format": "date"
        },
        "dayIndex": {
          "type": "integer",
          "minimum": 1,
          "maximum": 13
        },
        "agentId": {
          "type": "string",
          "pattern": "^AGENT-[0-9]{8}$"
        }
      },
      "required": ["scheduleId", "startDate", "endDate", "dayIndex", "agentId"]
    },
    "diagramTask": {
      "type": "object",
      "properties": {
        "diagramType": {
          "type": "string",
          "enum": ["Flowchart", "Sequence", "Class"]
        },
        "stepIndex": {
          "type": "integer",
          "minimum": 1,
          "maximum": 3
        },
        "instructions": {
          "type": "string",
          "maxLength": 1000
        },
        "requiredComponents": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "User",
              "MinimapUI",
              "MainViewUI",
              "RecordingController",
              "RecordingService",
              "PlaybackService",
              "ArchiveService",
              "ArchiveStore",
              "ArchiveIndex",
              "RecordingSession",
              "MinimapEvent",
              "MinimapState"
            ]
          },
          "minItems": 6
        },
        "requiredFlows": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "User interaction -> MinimapUI -> RecordingController -> RecordingService",
              "RecordingService -> ArchiveService -> ArchiveStore",
              "ArchiveService -> ArchiveIndex",
              "User -> MinimapUI -> PlaybackService -> ArchiveService -> ArchiveStore -> PlaybackService -> MinimapUI",
              "Recording start/stop lifecycle",
              "Archival commit/flush",
              "Archive search and retrieval",
              "Playback reconstruction"
            ]
          },
          "minItems": 4
        },
        "namingRules": {
          "type": "array",
          "items": { "type": "string" }
        },
        "syntaxRules": {
          "type": "array",
          "items": { "type": "string" }
        },
        "turnTakingRules": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "required": [
        "diagramType",
        "stepIndex",
        "instructions",
        "requiredComponents",
        "requiredFlows",
        "namingRules",
        "syntaxRules"
      ]
    },
    "validationChecklist": {
      "type": "object",
      "properties": {
        "structuralChecks": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "pattern": "^SC-[0-9]+$" },
              "description": { "type": "string" },
              "required": { "type": "boolean" }
            },
            "required": ["id", "description", "required"]
          }
        },
        "domainChecks": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "pattern": "^DC-[0-9]+$" },
              "description": { "type": "string" },
              "required": { "type": "boolean" }
            },
            "required": ["id", "description", "required"]
          }
        },
        "syntaxChecks": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": { "type": "string", "pattern": "^SY-[0-9]+$" },
              "description": { "type": "string" },
              "required": { "type": "boolean" }
            },
            "required": ["id", "description", "required"]
          }
        }
      },
      "required": ["structuralChecks", "domainChecks", "syntaxChecks"]
    },
    "outputFormat": {
      "type": "object",
      "properties": {
        "requireSummary": { "type": "boolean" },
        "requireAssumptions": { "type": "boolean" },
        "requireKnownGaps": { "type": "boolean" },
        "mermaidBlockLabel": {
          "type": "string",
          "enum": ["mermaid"]
        },
        "maxAdditionalTextLines": {
          "type": "integer",
          "minimum": 0,
          "maximum": 10
        }
      },
      "required": [
        "requireSummary",
        "requireAssumptions",
        "requireKnownGaps",
        "mermaidBlockLabel",
        "maxAdditionalTextLines"
      ]
    },
    "successCriteria": {
      "type": "object",
      "properties": {
        "minChecklistPassRate": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "mustIncludeComponents": {
          "type": "array",
          "items": { "type": "string" }
        },
        "mustIncludeFlows": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "required": ["minChecklistPassRate", "mustIncludeComponents", "mustIncludeFlows"]
    },
    "runReport": {
      "type": "object",
      "properties": {
        "date": {
          "type": "string",
          "format": "date"
        },
        "agentId": {
          "type": "string",
          "pattern": "^AGENT-[0-9]{8}$"
        },
        "diagramType": {
          "type": "string",
          "enum": ["Flowchart", "Sequence", "Class"]
        },
        "checklistResults": {
          "type": "object",
          "properties": {
            "structuralChecks": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": { "type": "string" },
                  "pass": { "type": "boolean" },
                  "notes": { "type": "string" }
                },
                "required": ["id", "pass"]
              }
            },
            "domainChecks": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": { "type": "string" },
                  "pass": { "type": "boolean" },
                  "notes": { "type": "string" }
                },
                "required": ["id", "pass"]
              }
            },
            "syntaxChecks": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": { "type": "string" },
                  "pass": { "type": "boolean" },
                  "notes": { "type": "string" }
                },
                "required": ["id", "pass"]
              }
            }
          }
        },
        "summary": { "type": "string", "maxLength": 200 },
        "assumptions": {
          "type": "array",
          "items": { "type": "string" }
        },
        "knownGaps": {
          "type": "array",
          "items": { "type": "string" }
        },
        "mermaidDiagram": { "type": "string" },
        "overallAssessment": {
          "type": "string",
          "enum": ["PASS", "PASS_WITH_NOTES", "FAIL", "INCOMPLETE"]
        }
      }
    }
  }
}
```

---

## 3. Example Filled Form (Flowchart Step)

```json
{
  "jobMetadata": {
    "jobId": "MM-ARCH-DIAGRAMS-001",
    "jobName": "Minimap Recording + Archival Diagrams",
    "createdBy": "manual-orchestrator",
    "createdAt": "2026-03-31T12:00:00Z",
    "version": "1.0.0"
  },
  "context": {
    "domain": "minimap-recording-and-archival",
    "description": "Design diagrams for a minimap recording tool expansion and archival system, including recording sessions, archival storage, and playback.",
    "features": [
      "Minimap recording (start/stop, event capture, state capture)",
      "Archival storage (integrity, indexing, retention)",
      "Playback from archives (reconstruct minimap state)"
    ],
    "constraints": [
      "Use mermaid syntax only",
      "All labels in quotes",
      "No nested code fences or images",
      "No generic service names",
      "Must show all three flows: recording, archival, playback"
    ]
  },
  "schedule": {
    "scheduleId": "REVIEW-20260329",
    "startDate": "2026-03-29",
    "endDate": "2026-04-10",
    "dayIndex": 3,
    "agentId": "AGENT-20260331"
  },
  "diagramTask": {
    "diagramType": "Flowchart",
    "stepIndex": 1,
    "instructions": "Create a mermaid flowchart showing the end-to-end flow for minimap recording, archival, and playback. Use compact layout (TD or LR). All node labels in quotes.",
    "requiredComponents": [
      "User",
      "MinimapUI",
      "RecordingController",
      "RecordingService",
      "ArchiveService",
      "ArchiveStore",
      "ArchiveIndex",
      "PlaybackService"
    ],
    "requiredFlows": [
      "User interaction -> MinimapUI -> RecordingController -> RecordingService",
      "RecordingService -> ArchiveService -> ArchiveStore",
      "ArchiveService -> ArchiveIndex",
      "User -> MinimapUI -> PlaybackService -> ArchiveService -> ArchiveStore -> PlaybackService -> MinimapUI"
    ],
    "namingRules": [
      "Use domain-specific names exactly as listed in requiredComponents",
      "Avoid generic names such as 'FeatureService' or 'Component'",
      "Use PascalCase for component names in quotes"
    ],
    "syntaxRules": [
      "Use 'flowchart TD' or 'flowchart LR'",
      "Wrap diagram in single ```mermaid code block",
      "Ensure all node labels are in quotes",
      "No nested mermaid blocks"
    ],
    "turnTakingRules": [
      "Generate ONLY this diagram",
      "After generation, output summary, assumptions, known gaps",
      "Do NOT proceed to next diagram until explicitly instructed"
    ]
  },
  "validationChecklist": {
    "structuralChecks": [
      {
        "id": "SC-1",
        "description": "All 8 required components are present as nodes",
        "required": true
      },
      {
        "id": "SC-2",
        "description": "All 4 required flows are represented by edges",
        "required": true
      },
      {
        "id": "SC-3",
        "description": "Diagram has clear start and end points",
        "required": true
      }
    ],
    "domainChecks": [
      {
        "id": "DC-1",
        "description": "Diagram shows recording start/stop lifecycle",
        "required": true
      },
      {
        "id": "DC-2",
        "description": "Diagram shows archival commit/flush to ArchiveStore",
        "required": true
      },
      {
        "id": "DC-3",
        "description": "Diagram shows archival retrieval and playback onto minimap",
        "required": true
      },
      {
        "id": "DC-4",
        "description": "ArchiveIndex is shown as searchable from ArchiveService",
        "required": true
      }
    ],
    "syntaxChecks": [
      {
        "id": "SY-1",
        "description": "Diagram uses valid mermaid flowchart syntax",
        "required": true
      },
      {
        "id": "SY-2",
        "description": "All labels are in double quotes",
        "required": true
      },
      {
        "id": "SY-3",
        "description": "No nested ```mermaid blocks",
        "required": true
      }
    ]
  },
  "outputFormat": {
    "requireSummary": true,
    "requireAssumptions": true,
    "requireKnownGaps": true,
    "mermaidBlockLabel": "mermaid",
    "maxAdditionalTextLines": 6
  },
  "successCriteria": {
    "minChecklistPassRate": 1.0,
    "mustIncludeComponents": [
      "MinimapUI",
      "RecordingService",
      "ArchiveService",
      "PlaybackService"
    ],
    "mustIncludeFlows": [
      "recording pipeline from UI to ArchiveStore",
      "playback pipeline from ArchiveStore to UI"
    ]
  },
  "runReport": {
    "date": "2026-03-31",
    "agentId": "AGENT-20260331",
    "diagramType": "Flowchart",
    "checklistResults": {
      "structuralChecks": [
        { "id": "SC-1", "pass": true, "notes": "" },
        { "id": "SC-2", "pass": true, "notes": "" },
        { "id": "SC-3", "pass": true, "notes": "" }
      ],
      "domainChecks": [
        { "id": "DC-1", "pass": true, "notes": "" },
        { "id": "DC-2", "pass": true, "notes": "" },
        { "id": "DC-3", "pass": true, "notes": "" },
        { "id": "DC-4", "pass": true, "notes": "" }
      ],
      "syntaxChecks": [
        { "id": "SY-1", "pass": true, "notes": "" },
        { "id": "SY-2", "pass": true, "notes": "" },
        { "id": "SY-3", "pass": true, "notes": "" }
      ]
    },
    "summary": "Flowchart showing complete minimap recording, archival, and playback flow with all required components and relationships.",
    "assumptions": [
      "Single-user recording session per diagram instance",
      "ArchiveStore represents durable storage abstraction"
    ],
    "knownGaps": [
      "Multi-tenancy not explicitly shown",
      "Error handling paths simplified"
    ],
    "mermaidDiagram": "```mermaid\nflowchart TD\n    ...\n```",
    "overallAssessment": "PASS"
  }
}
```

---

## 4. Automation Integration Points

### 4.1 For Scheduled Agent Jobs

```yaml
scheduler_config:
  schedule_id_template: "REVIEW-YYYYMMDD"
  agent_id_template: "AGENT-YYYYMMDD"
  day_index_calculation: "DAYS_BETWEEN(start_date, today) + 1"
  
triggers:
  - condition: "day_index <= 13"
    action: "GENERATE_DIAGRAM_TASK"
    
validation:
  - check: "checklist_pass_rate >= success_criteria.minChecklistPassRate"
    on_fail: "RETRY_WITH_FEEDBACK"
    on_pass: "PROCEED_TO_NEXT_DIAGRAM"
```

### 4.2 For Multi-Pass Review (A/B/C)

```yaml
multi_pass_config:
  pass_a:
    focus: "structural_completeness"
    checks: ["SC-1", "SC-2", "SC-3"]
  pass_b:
    focus: "domain_fidelity"
    checks: ["DC-1", "DC-2", "DC-3", "DC-4"]
  pass_c:
    focus: "syntax_and_format"
    checks: ["SY-1", "SY-2", "SY-3"]
```

### 4.3 For 2/3/5 +1,2,3 Pattern

```yaml
review_pattern:
  two_passes:
    - name: "Problem & Risk-Focused"
      focus: ["missing_components", "incorrect_flows", "syntax_errors"]
    - name: "Improvement & Optimization-Focused"
      focus: ["readability", "completeness", "domain_accuracy"]
  
  three_recommendations_per_pass: true
  five_sub_bullets_per_recommendation: true
  
  additions_refinements_removals:
    added: 1
    refined: 2
    removed_simplified: 3
```

---

## 5. Deliverable Mapping

| Deliverable ID | Schema Section | Validation Check |
|----------------|----------------|------------------|
| MM-1 | `diagramTask.requiredFlows` + `domainChecks` | All recording flows present |
| MM-2 | `context.constraints` | Performance considerations noted |
| MM-3 | `domainChecks` | UX flows documented |
| MM-4 | `syntaxChecks` | No critical errors |
| MM-5 | `successCriteria.minChecklistPassRate` | >= threshold |
| AR-1 | `domainChecks.DC-2` | Archival flow verified |
| AR-2 | `domainChecks.DC-4` | Indexing shown |
| AR-3 | `context.features` | Retention mentioned |
| AR-4 | `diagramTask.requiredComponents` | ArchiveStore present |
| AR-5 | `runReport.assumptions` + `knownGaps` | Documentation complete |
| IN-1 | `domainChecks.DC-3` | Playback flow shown |
| IN-2 | `structuralChecks.SC-2` | End-to-end flow present |
| IN-3 | `runReport` structure | Observable outputs |
| PLAN-1 | `overallAssessment` | Not FAIL |
| PLAN-2 | `review_pattern` config | 2 passes completed |
| PLAN-3 | `successCriteria` | All must-include met |

---

## 6. Usage Instructions

### For Human Operators

1. Fill `jobMetadata`, `context`, `schedule` sections
2. Select `diagramTask.diagramType` (Flowchart/Sequence/Class)
3. Review `validationChecklist` - add custom checks if needed
4. Provide filled form to chatbot as system prompt
5. Review `runReport` output against `successCriteria`

### For Automated Agents

1. Generate `schedule` and `agentId` from current date
2. Calculate `dayIndex` from schedule range
3. Select diagram type based on day index (Day 1=Flowchart, Day 2=Sequence, Day 3=Class)
4. Populate `runReport` with bot outputs
5. Validate checklist results programmatically
6. Store structured output for downstream processing

---

*Schema Version: 1.0.0*  
*Last Updated: 2026-03-31*  
*Compatible with: Minimap Recording Tool v2.0+, Archival System v1.5+*