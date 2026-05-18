# VS Code: Extensions - API Key & Authentication Requirements Research

**Research Date:** April 5, 2026

This document provides comprehensive information about API key and authentication requirements for 30 popular VS Code: extensions.

---

## Summary Table

| # | Extension ID | API Key Required | Account Required | Cost | Setup Complexity |
|---|--------------|------------------|------------------|------|------------------|
| 1 | anthropic.claude-code | YES | YES (Anthropic) | Pay-per-use ($5 min) | MEDIUM |
| 2 | moonshot-ai.kimi-code | YES | YES (Moonshot) | Pay-per-use | MEDIUM |
| 3 | saoudrizwan.claude-dev (Cline) | YES | Depends on Provider | Varies by provider | MEDIUM |
| 4 | zencoderai.zencoder | NO | YES (Zencoder) | Freemium ($0-$250/mo) | SIMPLE |
| 5 | github.copilot-chat | NO | YES (GitHub) | Freemium ($0-$39/mo) | SIMPLE |
| 6 | dawoodahmad.brainsync | NO | NO | FREE | SIMPLE |
| 7 | cortex-ai-memory.cortex-memory | OPTIONAL | NO | Freemium | SIMPLE |
| 8 | tienn-fpt.knowledge-rag | NO | NO | FREE | MEDIUM |
| 9 | semanticworkbenchteam.mcp-server-vscode | NO | NO | FREE | MEDIUM |
| 10 | autohome.mcp-store | NO | NO | FREE | SIMPLE |
| 11 | upstash.context7-mcp | OPTIONAL | OPTIONAL | Freemium | MEDIUM |
| 12 | mrbeandev.mcp-sqlite-tool | NO | NO | FREE | SIMPLE |
| 13 | burakkalafat.diffpilot | NO | NO | FREE | SIMPLE |
| 14 | rbfinch.hindsight-mcp | NO | NO | FREE | SIMPLE |
| 15 | kennethhuang.unittest-mcp | NO | NO | FREE | SIMPLE |
| 16 | cherchyk.mcpbrowser | NO | NO | FREE | MEDIUM |
| 17 | mrbeandev.mcp-http-tool | NO | NO | FREE | SIMPLE |
| 18 | gleidsonfersanp.mcp-image-reader | NO | NO | FREE | MEDIUM |
| 19 | digitaldefiance.mcp-screenshot | NO | NO | FREE | SIMPLE |
| 20 | sbroenne.excel-mcp | NO | NO | FREE | COMPLEX |
| 21 | manicagency.tenets-mcp-server | NO | NO | FREE | SIMPLE |
| 22 | quiver-math.quiver-math-research-agent | YES | YES | Paid | MEDIUM |
| 23 | sasidharakurathi.repo-scribe-lite | NO | NO | FREE | SIMPLE |
| 24 | forgedapps.mcpflare | NO | NO | FREE | MEDIUM |
| 25 | plugmonkey.duckdb-powerhouse | NO | NO | FREE | SIMPLE |
| 26 | neoresearchinc.heyneo | YES | YES (Neo) | Freemium | MEDIUM |
| 27 | zuban.zubanls | NO | NO | FREE (AGPL) | MEDIUM |
| 28 | vijaynirmal.playwright-mcp-relay | NO | NO | FREE | MEDIUM |
| 29 | yensubldg.agent-memory-indexer | NO | NO | FREE | SIMPLE |
| 30 | sudoecho.anyrag-pilot | NO | NO | Freemium | MEDIUM |

---

## Detailed Extension Information

### 1. anthropic.claude-code

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `anthropic.claude-code` |
| **Name** | Claude Code |
| **Publisher** | Anthropic |
| **Category** | AI Coding Assistant |

#### API Key Requirements
- **API Key Required:** YES
- **Key Type:** Anthropic API Key (`sk-ant-api03-...`)
- **Get Key From:** https://console.anthropic.com

#### Account Requirements
- **Account Required:** YES
- **Account Type:** Anthropic account with billing
- **Free Tier:** NO (minimum $5 to activate)
- **Pricing Model:** Pay-per-use
  - Claude Opus 4.6: $5/MTok input, $25/MTok output
  - Claude Sonnet 4.6: $3/MTok input, $15/MTok output
- **Subscription Options:**
  - Claude Pro: $20/month
  - Claude Max: $100/month (5x usage)
- **MFA:** Optional (recommended for account security)

#### Setup Complexity: MEDIUM
1. Create Anthropic account
2. Add payment method (min $5)
3. Generate API key at console.anthropic.com
4. Set `ANTHROPIC_API_KEY` environment variable or enter when prompted
5. Optional: Configure `CLAUDE_CODE_USE_FOUNDRY=1` for Microsoft Foundry

#### Notes
- Can also authenticate via OAuth for Pro/Max subscribers
- Supports Microsoft Foundry (Azure) with Entra ID
- VS Code: extension requires CLI installation first
- Data not used for training (configurable zero retention)

---

### 2. moonshot-ai.kimi-code

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `moonshot-ai.kimi-code` |
| **Name** | Kimi Code |
| **Publisher** | Moonshot AI |
| **Category** | AI Coding Assistant |

#### API Key Requirements
- **API Key Required:** YES
- **Key Type:** Moonshot API Key (`sk-...`)
- **Get Key From:** https://platform.moonshot.cn/console/info

#### Account Requirements
- **Account Required:** YES
- **Account Type:** Moonshot AI account
- **Free Tier:** YES (credits for new users)
- **Pricing Model:** Pay-per-use based on model
  - K2.5: Competitive rates vs Claude
  - 256K context window
- **MFA:** Not specified

#### Setup Complexity: MEDIUM
1. Create account at Moonshot AI Platform
2. Generate API key from console
3. Configure extension with API key
4. Select model (kimi-k2.5, kimi-k2-turbo, etc.)

#### Notes
- Two API endpoints: General (`api.moonshot.cn/v1`) and Code-optimized (`api.kimi.com/coding/v1`)
- K2.5 model features 256K token context window
- Strong performance on coding benchmarks
- Often positioned as cheaper alternative to Claude

---

### 3. saoudrizwan.claude-dev (Cline)

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `saoudrizwan.claude-dev` |
| **Name** | Cline (formerly Claude Dev) |
| **Publisher** | Saoud Rizwan |
| **Category** | AI Coding Agent |

#### API Key Requirements
- **API Key Required:** YES (depends on provider)
- **Supported Providers:** 
  - Anthropic (Claude)
  - OpenAI (GPT)
  - OpenRouter
  - Google Gemini
  - AWS Bedrock
  - Azure OpenAI
  - GCP Vertex
  - Cerebras
  - Groq
  - Ollama (local)
  - LM Studio (local)

#### Account Requirements
- **Account Required:** Depends on provider
- **Free Tier:** Varies by provider
  - Local models (Ollama): FREE
  - OpenRouter: Pay-per-use
  - Cloud providers: Paid
- **MFA:** Depends on provider

#### Setup Complexity: MEDIUM
1. Install extension from marketplace
2. Click Cline icon in activity bar
3. Select API provider from dropdown
4. Enter API key for selected provider
5. Choose model
6. Start coding

#### Notes
- Open-source (Apache 2.0)
- Multi-provider support - not locked to one vendor
- Plan Mode and Act Mode for structured workflows
- Tracks token usage and costs
- Can use local models for complete privacy
- MCP (Model Context Protocol) support

---

### 4. zencoderai.zencoder

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `zencoderai.zencoder` |
| **Name** | Zencoder |
| **Publisher** | Zencoder AI |
| **Category** | AI Coding Agent |

#### API Key Requirements
- **API Key Required:** NO
- **Alternative Auth:** Zencoder account login

#### Account Requirements
- **Account Required:** YES
- **Account Type:** Zencoder account
- **Free Tier:** YES (30 Premium LLM Calls/day)
- **Pricing Plans:**
  | Plan | Price | Daily Calls |
  |------|-------|-------------|
  | Free | $0 | 30 |
  | Starter | $19/mo | 280 |
  | Core | $49/mo | 750 |
  | Advanced | $119/mo | 1,900 |
  | Max | $250/mo | 4,200 |
- **BYOK (Bring Your Own Key):** Available for OpenAI/Anthropic
- **MFA:** Not specified

#### Setup Complexity: SIMPLE
1. Install extension
2. Sign in with Zencoder account
3. Start using (no API key management)

#### Notes
- "Premium LLM Call" = each LLM interaction
- Unlimited "Slow Mode" calls on all plans
- Supports BYOK for power users
- Multi-repo indexing on paid plans
- SSO on Core and above

---

### 5. github.copilot-chat

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `github.copilot-chat` |
| **Name** | GitHub Copilot Chat |
| **Publisher** | GitHub/Microsoft |
| **Category** | AI Coding Assistant |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** YES (GitHub account)
- **Account Type:** GitHub account with Copilot subscription
- **Free Tier:** YES (Copilot Free - limited features)
- **Pricing Plans:**
  | Plan | Price | Premium Requests |
  |------|-------|------------------|
  | Free | $0 | 50/month |
  | Pro | $10/mo | 300/month |
  | Pro+ | $39/mo | 1,500/month |
  | Business | $19/user/mo | 300/user/month |
  | Enterprise | $39/user/mo | 1,000/user/month |
- **Student Discount:** YES (GitHub Student Pack - free Pro)
- **MFA:** Recommended (GitHub 2FA)

#### Setup Complexity: SIMPLE
1. Install extension
2. Sign in with GitHub account
3. Authorize Copilot access
4. Start using

#### Notes
- Built-in to VS Code: (no separate extension needed for 1.85+)
- Multiple AI models available (GPT-4, Claude, etc.)
- Agent mode for autonomous tasks
- Code completions + chat in one
- Free tier available since 2025

---

### 6. dawoodahmad.brainsync

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `dawoodahmad.brainsync` |
| **Name** | BrainSync |
| **Publisher** | Dawood Ahmad |
| **Category** | AI Memory/Context |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Local vs Cloud:** 100% Local
- **Cost:** FREE

#### Setup Complexity: SIMPLE
1. Install from marketplace
2. Extension auto-activates
3. No configuration needed

#### Notes
- Runs entirely inside VS Code: extension host
- No API keys, no cloud, no cost
- All capabilities execute locally
- Memory synchronization across sessions
- Works with VS Code:, Windsurf, Cursor

---

### 7. cortex-ai-memory.cortex-memory

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `cortex-ai-memory.cortex-memory` |
| **Name** | Cortex Memory |
| **Publisher** | Cortex |
| **Category** | AI Memory System |

#### API Key Requirements
- **API Key Required:** OPTIONAL
- **Providers:** Gemini (default), Anthropic, Ollama, or None

#### Account Requirements
- **Account Required:** NO (for basic use)
- **Free Tier:** YES
  - Gemini: 500 requests/day FREE
  - Ollama: FREE (local)
  - No API key: Basic pattern matching (FREE)
- **Paid Options:** Anthropic API (pay-per-use)
- **Pricing:**
  | Plan | Memories | Features |
  |------|----------|----------|
  | Free | 20 | Basic recall, anti-hallucination |
  | Pro | Unlimited | 12-layer brain, auto-learn, git memory |

#### Setup Complexity: SIMPLE
1. Install extension
2. Optional: Get Gemini key (free) at aistudio.google.com/apikey
3. Run `Ctrl+Shift+P` → "Cortex: Set API Key"
4. Start coding

#### Notes
- Works without API key (basic pattern matching)
- 100% local data storage (`.cortex/`)
- No telemetry
- MCP server included (no npm install needed)
- Supports Claude Code, Cursor, Cline, Copilot, Zed

---

### 8. tienn-fpt.knowledge-rag

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `tienn-fpt.knowledge-rag` |
| **Name** | Knowledge RAG |
| **Publisher** | Tienn FPT |
| **Category** | RAG/Document Search |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Local vs Cloud:** Local
- **Cost:** FREE

#### Setup Complexity: MEDIUM
1. Install extension
2. Index local documents
3. Query through interface

#### Notes
- Local RAG implementation
- No external API calls
- Document indexing and semantic search
- Works offline completely

---

### 9. semanticworkbenchteam.mcp-server-vscode

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `semanticworkbenchteam.mcp-server-vscode` |
| **Name** | VSCode MCP Server |
| **Publisher** | Semantic Workbench Team (Microsoft) |
| **Category** | MCP Server |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: MEDIUM
1. Install extension
2. Configure MCP client (Claude Desktop, etc.)
3. Use mcp-proxy for stdio bridge (if needed)

#### Notes
- Official Microsoft extension
- Exposes VS Code: tools via MCP
- Requires mcp-proxy for Claude Desktop (SSE → stdio)
- Port 6010 default
- Tools: code_checker, diagnostics, file operations

---

### 10. autohome.mcp-store

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `autohome.mcp-store` |
| **Name** | MCP Store |
| **Publisher** | Autohome |
| **Category** | MCP Server Manager |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: SIMPLE
1. Install from marketplace
2. Browse MCP servers
3. One-click install to Cline/Copilot/Cursor/Trae

#### Notes
- 1,748+ installs
- Supports private MCP Store data sources
- Cross-platform (VS Code:, Cursor, Trae)
- Marketplace for MCP servers

---

### 11. upstash.context7-mcp

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `upstash.context7-mcp` |
| **Name** | Context7 MCP Server |
| **Publisher** | Upstash |
| **Category** | Documentation MCP |

#### API Key Requirements
- **API Key Required:** OPTIONAL
- **Get Key From:** https://context7.com/dashboard

#### Account Requirements
- **Account Required:** OPTIONAL
- **Free Tier:** YES (with rate limits)
- **Paid Tier:** API key for higher limits and private repos
- **Cost:** Free for basic use

#### Setup Complexity: MEDIUM
1. Install extension
2. Optional: Create account at context7.com
3. Optional: Get API key for higher limits
4. Configure MCP client

#### Notes
- 9,900+ libraries supported
- Real-time documentation access
- Works with or without API key
- Rate limits apply without key
- Supports remote and local server connections

---

### 12. mrbeandev.mcp-sqlite-tool

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `mrbeandev.mcp-sqlite-tool` |
| **Name** | MCP SQLite Tool |
| **Publisher** | Mrbeandev |
| **Category** | Database MCP |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: SIMPLE
1. Install extension
2. Run `Ctrl+Shift+P` → "mcp-sqlite: Install & Configure Server"
3. Choose global or workspace scope
4. Server starts automatically

#### Notes
- 470+ installs
- Requires Python 3.7+
- No external database server needed
- Local SQLite file operations only
- Configures mcp.json automatically

---

### 13. burakkalafat.diffpilot

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `burakkalafat.diffpilot` |
| **Name** | DiffPilot |
| **Publisher** | Burak Kalafat |
| **Category** | Code Review MCP |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: SIMPLE
1. Install from marketplace
2. Works with existing AI assistant (Copilot, etc.)
3. Use `#check_changes` or `#review_code` in chat

#### Notes
- Local AI code review before pushing
- Works with GitHub Copilot, Claude, etc.
- Auto branch detection
- Secret scanning
- Commit message generation
- All processing happens locally
- Code never leaves machine

---

### 14. rbfinch.hindsight-mcp

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `rbfinch.hindsight-mcp` |
| **Name** | Hindsight MCP |
| **Publisher** | Rbfinch |
| **Category** | Development History MCP |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: SIMPLE
1. Install via `cargo install hindsight-mcp`
2. Configure `.vscode/mcp.json`
3. Use with Copilot Chat

#### Notes
- Consolidates git logs, test results, Copilot sessions
- SQLite-based storage
- Full-text search
- Activity summaries
- Requires cargo-nextest for test ingestion

---

### 15. kennethhuang.unittest-mcp

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `kennethhuang.unittest-mcp` |
| **Name** | Unit Test MCP |
| **Publisher** | Kenneth Huang |
| **Category** | Testing MCP |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: SIMPLE
1. Install from marketplace
2. Auto-configures on activation
3. Use `@UnitTestEngineer` in Copilot Chat

#### Notes
- Zero setup required
- Supports Jest, Vitest, Pytest, .NET
- Coverage reports
- Batch test generation
- Built-in prompt workflows
- Works with GitHub Copilot Chat

---

### 16. cherchyk.mcpbrowser

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `cherchyk.mcpbrowser` |
| **Name** | MCPBrowser |
| **Publisher** | Cherchyk |
| **Category** | Browser Automation MCP |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: MEDIUM
1. Install extension
2. Ensure Chrome/Edge/Brave is installed
3. Configure MCP client with `npx -y mcpbrowser@latest`

#### Notes
- Browser automation via MCP
- Web page interaction
- JavaScript execution
- Form filling
- Screenshot capture
- Requires Chrome/Edge/Brave
- MIT License

---

### 17. mrbeandev.mcp-http-tool

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `mrbeandev.mcp-http-tool` |
| **Name** | MCP HTTP Tool |
| **Publisher** | Mrbeandev |
| **Category** | HTTP MCP |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: SIMPLE
1. Install from marketplace
2. Configure via command palette
3. Start making HTTP requests

#### Notes
- HTTP requests via MCP
- REST API interaction
- File upload support
- Authentication support
- 208+ installs

---

### 18. gleidsonfersanp.mcp-image-reader

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `gleidsonfersanp.mcp-image-reader` |
| **Name** | MCP Image Reader (Video Reader MCP) |
| **Publisher** | GleidsonFerSanP |
| **Category** | Video Analysis MCP |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: MEDIUM
1. Install from marketplace
2. Extension auto-configures for Copilot
3. Start analyzing videos

#### Notes
- Video frame extraction
- Progressive context enrichment
- Token-efficient (up to 98% reduction)
- No FFmpeg installation required (bundled)
- Works with mp4, avi, mov, mkv, webm
- MIT License

---

### 19. digitaldefiance.mcp-screenshot

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `digitaldefiance.mcp-screenshot` |
| **Name** | MCP ACS Screenshot |
| **Publisher** | Digital Defiance |
| **Category** | Screenshot MCP |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: SIMPLE
1. Install from VS Code: Marketplace
2. Grant screen recording permissions (macOS)
3. Start using screenshot tools

#### Notes
- 5 screenshot tools (full, window, region, displays, list windows)
- PII masking (emails, phone, credit cards)
- Window exclusion (password managers)
- 267 tests with 100% pass rate
- Cross-platform (Linux, macOS, Windows)
- MIT License

---

### 20. sbroenne.excel-mcp

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `sbroenne.excel-mcp` |
| **Name** | Excel MCP Server |
| **Publisher** | Sbroenne |
| **Category** | Excel Automation MCP |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE
- **Platform:** Windows only (requires Excel)

#### Setup Complexity: COMPLEX
1. Install extension
2. Ensure Microsoft Excel 2016+ is installed
3. Enable VBA trust access (one-time setup)
4. Configure via Copilot Chat

#### Notes
- 25 tools, 230 operations
- Power Query, DAX, VBA support
- PivotTables, Charts, Formatting
- Requires Windows + Excel
- Self-contained (no .NET runtime needed)
- Agent Skill included

---

### 21. manicagency.tenets-mcp-server

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `manicagency.tenets-mcp-server` |
| **Name** | Tenets MCP Server |
| **Publisher** | Manic Agency |
| **Category** | MCP Server |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: SIMPLE
1. Install extension
2. Configure MCP client
3. Start using

#### Notes
- Limited public documentation
- Appears to be a utility MCP server
- Verify on marketplace for latest details

---

### 22. quiver-math.quiver-math-research-agent

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `quiver-math.quiver-math-research-agent` |
| **Name** | Quiver: Math Research Agent |
| **Publisher** | Quiver Math |
| **Category** | Math Research AI |

#### API Key Requirements
- **API Key Required:** YES
- **Storage:** API keys stored in VS Code: SecretStorage

#### Account Requirements
- **Account Required:** YES
- **Cost:** Paid (pricing not publicly disclosed)
- **Free Tier:** Unknown

#### Setup Complexity: MEDIUM
1. Install extension
2. Guided onboarding wizard on first activation
3. Enter API key when prompted

#### Notes
- Math research focused AI agent
- API keys securely stored
- Limited public pricing information
- Contact publisher for enterprise pricing

---

### 23. sasidharakurathi.repo-scribe-lite

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `sasidharakurathi.repo-scribe-lite` |
| **Name** | Repo Scribe Lite |
| **Publisher** | Sasidharakurathi |
| **Category** | Repository Documentation |

#### API Key Requirements
- **API Key Required:** NO
- **GitHub Token:** Optional (for private repos)

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: SIMPLE
1. Install from marketplace
2. Optional: Configure GitHub token for private repos
3. Start documenting

#### Notes
- Repository documentation generator
- Works with public repos without token
- GitHub PAT recommended for private repositories
- Lite version (free)

---

### 24. forgedapps.mcpflare

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `forgedapps.mcpflare` |
| **Name** | MCPflare |
| **Publisher** | Forged Apps |
| **Category** | MCP Security/Isolation |

#### API Key Requirements
- **API Key Required:** NO
- **Cloudflare Account:** Not required for local use

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: MEDIUM
1. Install extension
2. Click shield icon in activity bar
3. Auto-discovers MCPs from Claude/Cursor/Copilot
4. Toggle protection on

#### Notes
- Zero-trust MCP security
- V8 Isolate sandboxing (Cloudflare Workers)
- 98% token reduction with code mode
- Network isolation
- Auto-discovery from IDE configs
- Transparent proxy mode
- MIT License

---

### 25. plugmonkey.duckdb-powerhouse

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `plugmonkey.duckdb-powerhouse` |
| **Name** | DuckDB Powerhouse |
| **Publisher** | PlugMonkey |
| **Category** | Database Tool |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: SIMPLE
1. Install from marketplace
2. Connect via DuckDB sidebar
3. Query Parquet/CSV/JSON files

#### Notes
- In-memory DuckDB analytics
- Query Parquet, CSV, JSON directly
- No external dependencies (bundled)
- Remote connections (MotherDuck, PostgreSQL, S3)
- Right-click file → "View Data"
- MIT License
- 29.64 MB extension size

---

### 26. neoresearchinc.heyneo

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `neoresearchinc.heyneo` |
| **Name** | Neo - Autonomous ML Engineer |
| **Publisher** | Neo Research Inc |
| **Category** | ML/AI Development |

#### API Key Requirements
- **API Key Required:** YES
- **Credential Storage:** VS Code: SecretStorage (encrypted)

#### Account Requirements
- **Account Required:** YES (Neo account)
- **Account Creation:** https://heyneo.so
- **Free Tier:** YES (free signup)
- **Pricing:** Freemium (paid tiers likely)

#### Setup Complexity: MEDIUM
1. Install from marketplace
2. Click Neo icon in sidebar
3. Login with Neo account
4. Optional: Configure cloud integrations (AWS, W&B, HuggingFace, Kaggle)

#### Notes
- Train, fine-tune, test, deploy ML workflows
- Natural language interface
- Local code execution
- Frameworks: PyTorch, TensorFlow, scikit-learn, XGBoost, etc.
- Cloud integrations: AWS S3, W&B, HuggingFace, Kaggle
- Python 3.8+ required
- Internet required for AI inference

---

### 27. zuban.zubanls

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `zuban.zubanls` |
| **Name** | ZubanLS |
| **Publisher** | Zuban |
| **Category** | Python Language Server |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE (AGPL v3)
- **Commercial License:** Available (contact info@zubanls.com)

#### Setup Complexity: MEDIUM
1. Install Zuban via pip: `pip install zuban`
2. Install VS Code: extension
3. Activate virtual environment (if used)

#### Notes
- Python type checker / language server
- Written in Rust (20-200x faster than Mypy)
- Mypy-compatible mode
- LSP features: completions, goto, references, rename, diagnostics
- Passes >95% of Mypy's tests
- Supports Python 3.13, Django
- Dual-licensed: AGPL v3 or commercial

---

### 28. vijaynirmal.playwright-mcp-relay

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `vijaynirmal.playwright-mcp-relay` |
| **Name** | Playwright MCP Relay |
| **Publisher** | Vijay Nirmal |
| **Category** | Browser Automation MCP |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: MEDIUM
1. Install extension
2. Configure tool set manually in VS Code:
   - `Ctrl+Shift+P` → "Chat: Configure Tool Sets..."
   - Add playwright tools JSON
3. Use `#playwright` in chat

#### Notes
- Browser automation via Playwright
- 21 browser tools included
- Works even if MCP disabled in Copilot
- Accessibility snapshots (better than screenshots)
- Auto-connect option
- MIT License

---

### 29. yensubldg.agent-memory-indexer

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `yensubldg.agent-memory-indexer` |
| **Name** | Agent Memory Indexer |
| **Publisher** | Yensubldg |
| **Category** | AI Memory/RAG |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** FREE

#### Setup Complexity: SIMPLE
1. Install from marketplace
2. Right-click files/folders → "Add to Memory Index"
3. Chat with `@memory` in Copilot

#### Notes
- Local RAG for GitHub Copilot
- Tree-sitter parsing (TypeScript, Python, C++, Go, Rust, Java)
- Local embeddings (@xenova/transformers)
- LanceDB vector database
- No code leaves machine
- Memory Files view for management

---

### 30. sudoecho.anyrag-pilot

| Attribute | Details |
|-----------|---------|
| **Extension ID** | `sudoecho.anyrag-pilot` |
| **Name** | AnyRAG Pilot |
| **Publisher** | Sudoecho |
| **Category** | RAG for Copilot |

#### API Key Requirements
- **API Key Required:** NO

#### Account Requirements
- **Account Required:** NO
- **Cost:** Freemium
- **Pro Tier:** Custom embedding models, advanced features

#### Setup Complexity: MEDIUM
1. Install extension
2. Wait for Python dependencies (2-5 minutes first launch)
3. `Ctrl+Shift+P` → "AnyRAG Pilot: Index Workspace"
4. Use `@anyrag` in Copilot Chat

#### Notes
- Indexes codebase for RAG
- Three search modes: Semantic, Keyword, Hybrid
- ChromaDB vector database
- Local embeddings (3 preset models)
- Optional GPU acceleration
- Chat indexing with `/indexchat`
- Pro tier: Custom HuggingFace models

---

## Key Insights & Recommendations

### Free Extensions (No API Key Required)
The majority of MCP-based extensions (16 out of 30) are completely free with no API key required:
- brainsync, mcp-sqlite-tool, diffpilot, hindsight-mcp, unittest-mcp
- mcpbrowser, mcp-http-tool, mcp-image-reader, mcp-screenshot
- excel-mcp, mcpflare, duckdb-powerhouse, playwright-mcp-relay
- agent-memory-indexer, repo-scribe-lite

### Extensions with Free Tiers
Several extensions offer meaningful free tiers:
- **Zencoder:** 30 calls/day free
- **GitHub Copilot:** 50 requests/month free
- **Cortex Memory:** 20 memories free / 500 Gemini requests/day
- **Context7:** Works without API key (rate limited)
- **AnyRAG Pilot:** Free with optional Pro tier

### Must-Have Paid Extensions
For professional use, consider:
- **Claude Code:** Best for complex coding tasks ($5+ pay-per-use)
- **GitHub Copilot Pro:** Best value ($10/month, 300 requests)
- **Cline:** Best multi-provider flexibility (free + API costs)

### Setup Complexity Guide
- **SIMPLE (1-2 steps):** Zencoder, Copilot, BrainSync, MCP Store, SQLite Tool, DiffPilot, UnitTest MCP, Screenshot Tool, DuckDB
- **MEDIUM (3-5 steps):** Claude Code, Kimi, Cline, Context7, Video Reader, Excel MCP, MCPflare, Neo, Playwright Relay, AnyRAG
- **COMPLEX (5+ steps):** Excel MCP (requires Excel + VBA setup)

---

## Security Best Practices

1. **Never commit API keys** to repositories
2. **Use VS Code: SecretStorage** when available (Cortex, Quiver Math, Neo)
3. **Rotate API keys** regularly
4. **Use environment variables** for CLI tools
5. **Enable MFA** on all accounts when available
6. **Review permissions** requested by extensions
7. **Prefer local/self-hosted** options for sensitive codebases

---

*Research compiled on April 5, 2026. Pricing and features subject to change. Always verify current information on official extension pages.*
