# Agent Prompt: Monthly Agent Usage Report (40/40 Format)

## Task
Create a comprehensive monthly agent usage report presentation in **40/40 format**:
- **40 slides maximum** (concise, executive-ready)
- **40 seconds per slide** maximum (2,667 total seconds ≈ 44 minutes)
- Designed for monthly stakeholder review

---

## Input Data Requirements

### Required Metrics (Source from system)
```json
{
  "time_period": "Previous full calendar month",
  "agents": {
    "total_active": "number",
    "new_onboarded": "number", 
    "churned": "number",
    "by_tier": {
      "free": "number",
      "pro": "number",
      "enterprise": "number"
    }
  },
  "usage": {
    "total_conversations": "number",
    "total_messages": "number",
    "avg_session_duration_minutes": "number",
    "peak_concurrent_users": "number",
    "messages_per_conversation_avg": "number"
  },
  "performance": {
    "avg_response_time_ms": "number",
    "uptime_percentage": "number",
    "error_rate_percentage": "number",
    "satisfaction_score": "number (1-10)"
  },
  "feature_adoption": {
    "web_search": "percentage",
    "code_execution": "percentage", 
    "file_upload": "percentage",
    "image_generation": "percentage",
    "custom_agents": "percentage"
  },
  "top_use_cases": [
    {"category": "string", "percentage": "number"}
  ]
}
```

---

## Presentation Structure (40 Slides)

### Section 1: Executive Summary (Slides 1-5)
| Slide | Title | Content |
|-------|-------|---------|
| 1 | Cover | Report title, month/year, confidentiality notice |
| 2 | At-a-Glance | 6 key metrics in large typography (total agents, convos, satisfaction, uptime, growth %, top use case) |
| 3 | Month-over-Month | Summary table: This Month vs Last Month vs 3-Month Avg vs YoY |
| 4 | Executive Insights | 3 bullet insights + 1 recommendation |
| 5 | Agenda | Visual roadmap of remaining 35 slides |

### Section 2: Agent Ecosystem (Slides 6-12)
| Slide | Title | Visual |
|-------|-------|--------|
| 6 | Agent Count Trend | Line chart: 12-month active agent trend |
| 7 | Tier Distribution | Donut chart: Free/Pro/Enterprise split |
| 8 | New vs Churned | Waterfall chart: Monthly flow |
| 9 | Agent Growth Rate | Bar chart: Month-over-month % growth |
| 10 | Top 5 Agent Categories | Horizontal bar: Use case distribution |
| 11 | Agent Retention Cohort | Cohort matrix table |
| 12 | Geographic Distribution | World heatmap (if applicable) |

### Section 3: Usage Patterns (Slides 13-20)
| Slide | Title | Visual |
|-------|-------|--------|
| 13 | Conversation Volume | Area chart: Daily conversations (30 days) |
| 14 | Messages per Conversation | Histogram distribution |
| 15 | Session Duration | Box plot: Duration distribution by tier |
| 16 | Peak Usage Times | Heatmap: Hour × Day of week |
| 17 | Weekend vs Weekday | Comparison bar chart |
| 18 | Mobile vs Desktop | Device split pie chart |
| 19 | Conversation Funnel | Funnel: Started → Engaged → Completed |
| 20 | Power Users | Top 10% user contribution % |

### Section 4: Performance Metrics (Slides 21-26)
| Slide | Title | Visual |
|-------|-------|--------|
| 21 | Response Time Trend | Line chart: P50, P95, P99 latencies |
| 22 | Uptime & Availability | Status timeline + SLA gauge |
| 23 | Error Rate Analysis | Pie chart: Error category breakdown |
| 24 | Satisfaction Scores | NPS-style gauge + trend line |
| 25 | Performance by Tier | Grouped bar: Response time by tier |
| 26 | Incident Summary | Table: Date, Duration, Impact, Resolution |

### Section 5: Feature Adoption (Slides 27-32)
| Slide | Title | Visual |
|-------|-------|--------|
| 27 | Feature Usage Overview | Horizontal bars: All features % |
| 28 | Web Search Adoption | Trend line + usage stats |
| 29 | Code Execution Usage | Developer metrics (languages, executions) |
| 30 | File Upload Patterns | File type distribution |
| 31 | Image Generation | Volume + popular prompt categories |
| 32 | Custom Agent Creation | Builder tool usage metrics |

### Section 6: Business Impact (Slides 33-37)
| Slide | Title | Content |
|-------|-------|---------|
| 33 | Cost per Conversation | $ efficiency trend |
| 34 | Time Saved Estimate | Hours saved vs human equivalent |
| 35 | CSAT Correlation | Usage vs satisfaction scatter |
| 36 | Revenue Attribution | Estimated value by use case |
| 37 | ROI Summary | Simple ROI calculation |

### Section 7: Looking Forward (Slides 38-40)
| Slide | Title | Content |
|-------|-------|---------|
| 38 | Goals vs Actual | Scorecard: 3 monthly goals with status |
| 39 | Next Month Focus | 3 priorities with success metrics |
| 40 | Thank You / Q&A | Contact info, next meeting date |

---

## Design Specifications

### Color Palette
```
Primary:    #14B8A6 (Teal)     — Headers, key metrics
Secondary:  #F97316 (Orange)   — Alerts, warnings, growth
Accent:     #8B5CF6 (Purple)   — Secondary data, features
Background: #0F172A (Slate)    — Dark mode base
Surface:    #1E293B            — Cards, containers
Text:       #F8FAFC (White)    — Primary text
Muted:      #94A3B8            — Secondary text, labels
```

### Typography
- **Headlines:** 32pt bold, white
- **Subheadlines:** 24pt semibold
- **Body:** 16pt regular
- **Data labels:** 14pt monospace for numbers
- **Annotations:** 12pt muted color

### Visual Rules
1. **One chart per slide** (maximize data-ink ratio)
2. **Large numbers** for KPIs (minimum 48pt)
3. **Consistent legends** across all charts
4. **Source citations** in footer of each slide
5. **No paragraphs** — bullets max 6 words each
6. **40-second rule** — Each slide readable in ≤40 seconds

### Slide Layout Templates
```
[Template A: KPI Focus]
┌─────────────────────────────┐
│  [Icon] Metric Name         │
│                             │
│        1,247,389            │ ← Large number
│        ↑ 23.5% vs last mo   │ ← Trend indicator
│                             │
│  [Mini sparkline chart]     │
└─────────────────────────────┘

[Template B: Chart Focus]
┌─────────────────────────────┐
│  Chart Title                │
│  [Large Chart Area]         │
│                             │
│  Key insight in 6 words     │
└─────────────────────────────┘

[Template C: Comparison]
┌─────────────────────────────┐
│  This Month vs Last Month   │
│  ┌─────┐    ┌─────┐        │
│  │ 45K │ vs │ 38K │        │
│  └─────┘    └─────┘        │
│  +18.4% growth             │
└─────────────────────────────┘
```

---

## Output Format

### Option 1: HTML Presentation (Recommended)
Generate a single self-contained HTML file:
- Reveal.js or similar framework
- Responsive (16:9 aspect ratio)
- Keyboard navigation (arrow keys)
- Export to PDF capable

### Option 2: Markdown Slides
Generate 40 markdown files (one per slide) for import into:
- Slidev
- Marp
- Notion presentations

### Option 3: PDF Report
Generate paginated PDF with:
- 1 slide per page
- Print-ready (300 DPI)
- Embedded fonts

---

## Success Criteria

✅ **Exactly 40 slides** (no more, no less)
✅ **40 seconds per slide** (readable at glance)
✅ **Data-driven** (all claims backed by metrics)
✅ **Visual-first** (80% visuals, 20% text)
✅ **Consistent design** (same fonts, colors, spacing)
✅ **Actionable insights** (not just data dumps)

---

## Example Slide (Slide 2: At-a-Glance)

```
┌────────────────────────────────────────────┐
│  MONTHLY AGENT USAGE REPORT — MARCH 2026   │
├────────────────────────────────────────────┤
│                                            │
│   👤                    💬                   │
│   12,458               1.2M                │
│   Active Agents        Conversations       │
│   ↑ 8.3%               ↑ 15.7%             │
│                                            │
│   ⭐                    ⚡                   │
│   8.7/10               99.97%              │
│   Satisfaction         Uptime              │
│   ↑ 0.3 pts            —                   │
│                                            │
│   📈                                         │
│   Code Generation                          │
│   Top Use Case                             │
│   34% of usage                             │
│                                            │
└────────────────────────────────────────────┘
```

---

## Special Instructions

1. **If data is missing:** Use "N/A" with gray styling, do not make up numbers
2. **If month is partial:** Annualize or label "MTD" clearly
3. **If comparison unavailable:** Show only current period, omit % change
4. **Charts:** Use Chart.js, D3.js, or SVG — no external image dependencies
5. **Accessibility:** Include alt-text for all charts, minimum 4.5:1 contrast

---

## Deliverable Checklist

- [ ] 40 slides generated
- [ ] All slides viewable in ≤40 seconds each
- [ ] Color palette applied consistently
- [ ] All charts have legends and axis labels
- [ ] Source data cited in footers
- [ ] Navigation works (next/previous)
- [ ] Export to PDF tested
- [ ] Mobile responsive (optional but preferred)

---

## Prompt for Kimi Agent

"Create a 40-slide monthly agent usage presentation following the structure above. Use [INSERT DATA SOURCE/FILE] for metrics. Output as [HTML/Markdown/PDF]. Apply the dark theme with teal/orange accents. Each slide should be readable in 40 seconds. Include the 6-section structure: Executive Summary, Agent Ecosystem, Usage Patterns, Performance Metrics, Feature Adoption, Business Impact, and Looking Forward."
