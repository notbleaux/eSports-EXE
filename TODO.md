# VSCode Extensions Configuration for eSports-EXE & MoonshotAI/KIMI
Status: In Progress | Plan Approved

## Steps
### 1. Create .vscode/settings.json [PENDING]
 - Godot project path
 - Python/TS linters/formatters
 - MCP servers config
 - KIMI/Moonshot API (using key: 19cfe41e-51a2-88b7-8000-000047c146b7)

### 2. Update .vscode/extensions.json [PENDING]
 - Add 'ManicAgency.tenets-mcp-server' to recommendations
 - Ensure Godot Tools, MCP, KIMI present

### 3. Configure MCP for Tenets & Moonshot [PENDING]
 - blackbox_mcp_settings.json: Add Tenets & KIMI servers
 - mcp-config.json: Add Moonshot LLM server if applicable

### 4. Disable unuseful extensions [PENDING]
 - Remove multicoder references (none found)
 - Keep MCP Debugger, Godot Tools

### 5. Verification [PENDING]
 - VSCode Reload
 - `kimi mcp list`
 - Open Godot project
 - Check Tenets MCP output

### 6. Followups [PENDING]
 - Run `setup-local.ps1` for venv
 - Test Godot --headless platform/simulation-game/

