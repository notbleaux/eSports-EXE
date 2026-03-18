# OpenClaw + Kimi ACP Bridge Launcher
# This script starts the multi-agent collaboration bridge

param(
    [switch]$Background,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║     OpenClaw + Kimi Multi-Agent Collaboration Bridge         ║
║                                                              ║
║  Agents:                                                     ║
║    🤖 OpenClaw-Cloud  → Architecture & Planning              ║
║    💻 Kimi-CLI        → Implementation & Terminal            ║
║    📝 Kimi-VSCode:    → Editing & Debugging                  ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Check dependencies
Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow

$kimiVersion = kimi --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "kimi CLI not found. Please install: pip install kimi-cli"
    exit 1
}
Write-Host "  ✓ kimi CLI: $kimiVersion" -ForegroundColor Green

# Check MCP servers
Write-Host "🔌 Checking MCP servers..." -ForegroundColor Yellow
$mcpList = kimi mcp list 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ MCP servers configured" -ForegroundColor Green
    $mcpList | ForEach-Object { Write-Host "    - $_" -ForegroundColor Gray }
} else {
    Write-Warning "  ⚠ MCP servers not configured. Run: kimi mcp setup"
}

# Initialize shared state
$sharedStatePath = "$scriptDir/shared-state.json"
if (-not (Test-Path $sharedStatePath)) {
    Write-Host "📁 Initializing shared state..." -ForegroundColor Yellow
    $initialState = @{
        version = "1.0"
        last_updated = (Get-Date -Format "o")
        active_agents = @("kimi-cli", "kimi-vscode")
        current_task = $null
        shared_context = @{
            working_directory = $projectRoot
            git_branch = $null
            open_files = @()
            todo_list = @()
        }
        agent_states = @{
            "openclaw-cloud" = @{ status = "disconnected"; last_ping = $null }
            "kimi-cli" = @{ status = "active"; last_ping = (Get-Date -Format "o") }
            "kimi-vscode" = @{ status = "active"; last_ping = (Get-Date -Format "o") }
        }
    }
    
    # Get git branch
    try {
        $gitBranch = git -C $projectRoot rev-parse --abbrev-ref HEAD 2>$null
        $initialState.shared_context.git_branch = $gitBranch
    } catch {
        $initialState.shared_context.git_branch = "unknown"
    }
    
    $initialState | ConvertTo-Json -Depth 10 | Set-Content $sharedStatePath
    Write-Host "  ✓ Shared state initialized" -ForegroundColor Green
}

# Start ACP bridge
Write-Host "🚀 Starting ACP bridge..." -ForegroundColor Yellow

if ($Background) {
    # Start in background
    $proc = Start-Process -FilePath "kimi" -ArgumentList "acp", "--config", "$scriptDir/acp-bridge.json" -WindowStyle Hidden -PassThru
    Write-Host "  ✓ ACP bridge started (PID: $($proc.Id))" -ForegroundColor Green
    
    # Save PID for later
    $proc.Id | Set-Content "$scriptDir/.acp-bridge.pid"
} else {
    Write-Host @"

═══════════════════════════════════════════════════════════════
ACP Bridge is ready! Agents can now collaborate.

Commands:
  • Ctrl+C to stop
  • Open another terminal to interact with agents

To use:
  1. In VS Code:: Normal editing (auto-connected)
  2. In terminal: kimi --thinking for CLI agent
  3. Cloud agent: Connects via API when available
═══════════════════════════════════════════════════════════════

"@ -ForegroundColor Cyan
    
    # Run in foreground
    kimi acp --config "$scriptDir/acp-bridge.json" --stdio
}
