[Ver002.000]

# Integration Specification: [Integration Name]

## Overview
| Attribute | Value |
|-----------|-------|
| Source | [Source Component] |
| Target | [Target Component] |
| Protocol | [REST/GraphQL/gRPC/Message Queue] |
| Direction | [Uni/Bi-directional] |

## Data Flow
```
[Source] --[Format]--> [Middleware] --[Format]--> [Target]
```

## Contract

### Request
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| [field1] | [type] | [Yes/No] | [Description] |

### Response
| Field | Type | Description |
|-------|------|-------------|
| [field1] | [type] | [Description] |

## Error Handling
| Code | Scenario | Action |
|------|----------|--------|
| [Code] | [Scenario] | [Action] |

## Retry Policy
- Max retries: [Number]
- Backoff: [Linear/Exponential]
- Timeout: [Duration]

## Monitoring
| Metric | Threshold | Alert |
|--------|-----------|-------|
| [Latency] | [Value] | [Channel] |
| [Error Rate] | [Value] | [Channel] |
