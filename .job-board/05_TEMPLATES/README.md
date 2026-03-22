[Ver001.000]

# 05_TEMPLATES — Task and Blocker Templates

**Purpose:** Reusable templates for creating consistent tasks and blockers.

## Structure

```
05_TEMPLATES/
├── README.md              # This file
├── task-template.json     # Standard task template
├── blocker-template.json  # Standard blocker template
└── *.json                 # Additional specialized templates
```

## Usage

1. Copy the appropriate template
2. Fill in all required fields
3. Generate unique ID (TASK-YYYY-NNNN format)
4. Set timestamps to current time
5. Save to appropriate directory

## Creating New Templates

When you find yourself creating similar tasks repeatedly, consider creating a specialized template.

Name format: `{task-type}-template.json`

Examples:
- `bug-fix-template.json`
- `feature-template.json`
- `refactor-template.json`
- `documentation-template.json`
