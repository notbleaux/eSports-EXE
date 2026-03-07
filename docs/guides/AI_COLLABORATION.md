# 🤖 AI_COLLABORATION.md
## Working with AI Tools on SATOR-eXe-ROTAS

**Purpose:** Guidelines for effective collaboration with AI agents  
**Applies To:** Kimi, Kimi Claw, and other AI assistants  
**Last Updated:** March 7, 2026

---

## 🎯 Overview

This project has been developed with significant AI assistance. This guide helps you:
- Work effectively with AI tools
- Maintain project context across sessions
- Get the best results from AI collaboration

---

## 💬 Communication Principles

### 1. Be Specific
**❌ Vague:** "Fix the website"
**✅ Specific:** "Add a loading spinner to the SATOR hub page while data loads"

### 2. Provide Context
**Include:**
- What you're trying to achieve
- Why it matters
- Any constraints (budget, time, technology)
- Previous related decisions

### 3. Break Complex Tasks
Instead of one giant request, split into steps:
1. "Research the best approach for X"
2. "Create a plan for implementing X"
3. "Implement step 1 of the plan"
4. "Review and refine"

---

## 📝 Working with Kimi Claw

### Session Management
**Kimi Claw remembers:**
- Recent conversation (current session)
- Files you reference explicitly

**Kimi Claw does NOT remember:**
- Previous sessions (unless files saved)
- Context from other platforms (mobile vs web)

**Solution:** Use `PROJECT_MEMORY.md` and session files to maintain continuity.

### When Starting a New Session
**Recommended opening:**
```
"Continuing work on [specific feature]. 
See PROJECT_MEMORY.md for context.
Today I want to [specific task]."
```

### Referencing Previous Work
Always mention:
- File names you've worked on
- Decisions from previous sessions
- The overall goal

Example:
```
"Last session we created the VLR API in packages/shared/vlr-data/.
Now I need to add webhook support. Check the existing structure first."
```

---

## 🧠 Context Preservation

### Method 1: Project Memory (Recommended)
**File:** `docs/project/PROJECT_MEMORY.md`

Update with:
- Current phase/status
- Recent decisions
- Action items
- Links to relevant files

**When to update:**
- After major decisions
- When starting/finishing phases
- When context changes significantly

### Method 2: Session Files
Create files for complex investigations:
- `project/reports/INVESTIGATION_[topic].md`
- `project/roadmap/CURRENT_PLAN.md`

### Method 3: Git Commits
Good commit messages serve as historical record:
```
feat(api): Add VLR webhook support

- Implements auto-discovery parser
- Adds circuit breaker pattern
- Includes retry logic for failed requests

See docs/architecture/VLR_API.md for design details
```

---

## 🔄 Token Management

### What Uses Tokens
- AI conversations
- Longer responses cost more
- File operations are generally cheap

### Best Practices
1. **Be concise** — Shorter prompts = fewer tokens
2. **Reference files** — "See file X" vs pasting content
3. **Batch questions** — One message with 3 questions vs 3 messages
4. **Use summaries** — Request summaries instead of full analysis

### Warning Signs
- Responses getting slower
- Shortened responses
- Explicit token warnings

**Action:** Start a fresh session, reference PROJECT_MEMORY.md

---

## 🎭 AI Capabilities & Limitations

### ✅ What AI Can Do Well
- Write code from specifications
- Research and summarize information
- Refactor and improve existing code
- Create documentation
- Analyze code for issues
- Generate test cases
- Explain complex concepts

### ⚠️ What AI Struggles With
- Understanding unstated requirements
- Making aesthetic/design judgments without references
- Accessing external systems (APIs, databases)
- Long-running tasks without check-ins
- Remembering across sessions

### ❌ What AI Cannot Do
- Access your local machine (unless via approved tools)
- Make final decisions for you
- Guarantee production-ready code without testing
- Replace human judgment on important decisions

---

## 🛡️ Safety & Security

### NEVER Share With AI
- Passwords
- API keys (in plaintext)
- Personal identifying information
- Financial information
- Private user data

### Safe to Share
- Code from your repository
- Public documentation
- Error messages
- General architecture questions
- Public data sources

### Token Storage
Store tokens in:
- Environment variables
- GitHub Secrets
- Secure credential managers

**Not in:** Code, logs, or AI conversations

---

## 📝 Effective Prompting

### Template for Code Tasks
```
Task: [What you want built]

Context:
- Located in: [file path]
- Current state: [brief description]
- Tech stack: [React/Python/etc.]
- Constraints: [performance, compatibility, etc.]

Requirements:
1. [Specific requirement]
2. [Specific requirement]
3. [Specific requirement]

Reference:
- Similar implementation: [file path]
- Documentation: [link or file]
```

### Template for Research
```
Research: [Topic]

Goal: [What decision this informs]

Specific questions:
1. [Question]
2. [Question]

Output format:
- Summary (2-3 sentences)
- Key findings (bullet points)
- Recommendations (if applicable)
```

---

## 🎯 Quality Assurance

### Always Review AI Output
**Check for:**
- [ ] Correctness (does it work?)
- [ ] Style consistency (matches project?)
- [ ] Security (no vulnerabilities?)
- [ ] Performance (efficient?)
- [ ] Documentation (explained?)

### Test Before Committing
```bash
# For code
npm run test
npm run build

# For documentation
Preview markdown rendering
Check links work
```

### Iterate
First draft rarely perfect. It's okay to:
- "Refactor this for clarity"
- "Add error handling"
- "Make this more efficient"

---

## 📚 Project-Specific Context

### Important Files to Reference
| File | Purpose |
|------|---------|
| `PROJECT_MEMORY.md` | Current status and decisions |
| `COMMIT_STANDARDS.md` | How to write commits |
| `CONTRIBUTING.md` | How to make changes |
| `README.md` | Project overview |
| `TROUBLESHOOTING.md` | Common issues |

### Current Project Phase
Check PROJECT_MEMORY.md for:
- What phase we're in
- Current priorities
- Recent decisions
- Blockers

---

## 🤝 Collaboration Etiquette

### When AI Suggests Something Wrong
**Don't:** "You're wrong"
**Do:** "Actually, we decided X in PROJECT_MEMORY.md because Y. Let's do Z instead."

### When You Change Your Mind
**Say:** "New plan: instead of X, let's do Y because [reason]."

### When AI Is Unclear
**Ask:** "Can you explain that differently?" or "Show me an example."

### When Task Is Complete
**Confirm:** "That's correct. Please save this to [file] and update PROJECT_MEMORY."

---

## 🚀 Advanced Tips

### 1. Use Files as Memory
Create investigation files, then reference them:
```
"See project/reports/VLR_RESEARCH.md for the API research we did."
```

### 2. Version Control Everything
Commit frequently:
- Before major changes
- After completing a feature
- Before ending a session

### 3. Use Checklists
Give AI structured tasks:
```
Implement feature X:
- [ ] Create component file
- [ ] Add styling
- [ ] Write tests
- [ ] Update documentation
```

### 4. Explicitly State Priority
```
"Priority order: 1) Security, 2) Performance, 3) Clean code"
```

---

## 📞 When to Escalate

**Get human help when:**
- AI is consistently misunderstanding
- Critical production issue
- Security concern
- Legal/compliance question
- Budget concern

**AI is a tool, not a replacement for human judgment.**

---

*Last Updated: March 7, 2026*