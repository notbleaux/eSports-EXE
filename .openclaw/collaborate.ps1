# OpenClaw + Kimi Multi-Agent Collaboration Commands
# Usage: .openclaw/collaborate.ps1 <command> [options]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("status", "task", "delegate", "sync", "review", "plan")]
    [string]$Command,
    
    [string]$To,
    [string]$Message,
    [string]$File,
    [switch]$All
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sharedStatePath = "$scriptDir/shared-state.json"
$manifestPath = "$scriptDir/agent-manifest.yaml"

function Get-SharedState {
    if (Test-Path $sharedStatePath) {
        return Get-Content $sharedStatePath | ConvertFrom-Json
    }
    return $null
}

function Update-AgentState($agentId, $status) {
    $state = Get-SharedState
    if ($state -and $state.agent_states.$agentId) {
        $state.agent_states.$agentId.status = $status
        $state.agent_states.$agentId.last_ping = (Get-Date -Format "o")
        $state.last_updated = (Get-Date -Format "o")
        $state | ConvertTo-Json -Depth 10 | Set-Content $sharedStatePath
    }
}

switch ($Command) {
    "status" {
        Write-Host "==============================================================" -ForegroundColor Cyan
        Write-Host "                    Agent Status Board                        " -ForegroundColor Cyan
        Write-Host "==============================================================" -ForegroundColor Cyan
        
        $state = Get-SharedState
        if ($state) {
            Write-Host ""
            Write-Host "Active Agents:" -ForegroundColor Yellow
            foreach ($agent in $state.agent_states.PSObject.Properties) {
                $status = $agent.Value.status
                $lastPing = $agent.Value.last_ping
                $color = switch ($status) {
                    "active" { "Green" }
                    "standby" { "Yellow" }
                    "disconnected" { "Red" }
                    default { "Gray" }
                }
                Write-Host "  [$($agent.Name)]" -NoNewline -ForegroundColor $color
                Write-Host " Status: $status" -NoNewline
                if ($lastPing) {
                    $time = [DateTime]$lastPing
                    Write-Host " (Last ping: $($time.ToString('HH:mm:ss')))" -NoNewline -ForegroundColor Gray
                }
                Write-Host ""
                Write-Host "    Capabilities: $($agent.Value.capabilities -join ', ')" -ForegroundColor Gray
            }
            
            Write-Host ""
            Write-Host "MCP Servers:" -ForegroundColor Yellow
            foreach ($server in $state.mcp_servers.PSObject.Properties) {
                $color = if ($server.Value.status -eq "connected") { "Green" } else { "Red" }
                Write-Host "  * $($server.Name): " -NoNewline
                Write-Host $server.Value.status -ForegroundColor $color
            }
            
            Write-Host ""
            $currentTask = if ($state.current_task) { $state.current_task } else { "None" }
            Write-Host "Current Task: $currentTask" -ForegroundColor Yellow
        }
    }
    
    "task" {
        if (-not $Message) {
            Write-Error "Usage: collaborate.ps1 task -Message 'description' [-To agent]"
            exit 1
        }
        
        $state = Get-SharedState
        $state.current_task = $Message
        $state.last_updated = (Get-Date -Format "o")
        $state | ConvertTo-Json -Depth 10 | Set-Content $sharedStatePath
        
        Write-Host "[Task] Task created: $Message" -ForegroundColor Cyan
        
        if ($To) {
            Write-Host "[Delegate] Delegating to: $To" -ForegroundColor Yellow
            Update-AgentState $To "busy"
        } else {
            Write-Host "[Tip] Tip: Use -To <agent> to delegate (openclaw-cloud, kimi-cli, kimi-vscode)" -ForegroundColor Gray
        }
    }
    
    "delegate" {
        if (-not $To -or -not $Message) {
            Write-Host @"
Usage: collaborate.ps1 delegate -To <agent> -Message <task>

Agents:
  * openclaw-cloud  -> Architecture, planning, reviews
  * kimi-cli        -> Implementation, terminal, git
  * kimi-vscode     -> Editing, debugging, inline help

Example:
  collaborate.ps1 delegate -To "openclaw-cloud" -Message "Review PR #123"
"@ -ForegroundColor Yellow
            exit 0
        }
        
        Write-Host "[Delegate] Delegating to $To..." -ForegroundColor Cyan
        Write-Host "Task: $Message" -ForegroundColor White
        
        switch ($To) {
            "openclaw-cloud" {
                Write-Host "[Cloud] Sending to OpenClaw Cloud Agent..." -ForegroundColor Yellow
                Update-AgentState "openclaw-cloud" "busy"
            }
            "kimi-cli" {
                Write-Host "[CLI] Executing via Kimi CLI..." -ForegroundColor Yellow
                kimi --thinking "$Message"
                Update-AgentState "kimi-cli" "active"
            }
            "kimi-vscode" {
                Write-Host "[VSCode:] Opening in VS Code:..." -ForegroundColor Yellow
                Update-AgentState "kimi-vscode" "busy"
            }
        }
    }
    
    "sync" {
        Write-Host "[Sync] Syncing agent states..." -ForegroundColor Yellow
        Update-AgentState "kimi-cli" "active"
        Update-AgentState "kimi-vscode" "active"
        Write-Host "[OK] Sync complete" -ForegroundColor Green
    }
    
    "review" {
        Write-Host "[Review] Requesting code review..." -ForegroundColor Cyan
        if ($File) {
            Write-Host "File: $File" -ForegroundColor White
        }
        Update-AgentState "openclaw-cloud" "busy"
        Write-Host "[Sent] Sent to OpenClaw-Cloud for review" -ForegroundColor Yellow
    }
    
    "plan" {
        Write-Host "[Plan] Creating architecture plan..." -ForegroundColor Cyan
        if (-not $Message) {
            $Message = "Create implementation plan for current task"
        }
        Update-AgentState "openclaw-cloud" "busy"
        Write-Host "[Delegated] Delegated to OpenClaw-Cloud" -ForegroundColor Yellow
        Write-Host "Task: $Message" -ForegroundColor White
    }
}

Write-Host ""
