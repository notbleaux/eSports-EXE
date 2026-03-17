# Open-Claw Webhook Server
# Receives and processes webhook events from cloud agent

param(
    [int]$Port = 3001,
    [string]$LogPath = ".openclaw/logs/webhook.log"
)

# Ensure log directory exists
$logDir = Split-Path -Parent $LogPath
if (!(Test-Path $logDir)) {
    New-Item -ItemType Directory -Force -Path $logDir
}

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Tee-Object -FilePath $LogPath -Append
}

Write-Log "Starting Open-Claw Webhook Server on port $Port"

# Track server start time for uptime calculation
$startTime = Get-Date

# Simple HTTP listener for webhooks
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Log "Webhook server listening on http://localhost:$Port/"
Write-Log "Endpoints: /webhook, /health, /status"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        $method = $request.HttpMethod
        
        Write-Log "Received $method request to $path"
        
        switch ($path) {
            
            "/webhook" {
                if ($method -eq "POST") {
                    # Read request body
                    $reader = New-Object System.IO.StreamReader($request.InputStream)
                    $body = $reader.ReadToEnd()
                    $reader.Close()
                    
                    try {
                        $event = $body | ConvertFrom-Json
                        Write-Log "Webhook event: $($event.type) from $($event.agent_id)"
                        
                        # Process event based on type
                        switch ($event.type) {
                            "task.created" {
                                Write-Log "Task created: $($event.task_id)"
                                # Notify local agents via JLB
                                $message = @{
                                    type = "task_notification"
                                    task_id = $event.task_id
                                    from = $event.agent_id
                                    message = "New task from Open-Claw Cloud"
                                } | ConvertTo-Json
                                $message | Out-File -FilePath ".job-board/00_INBOX/kimi-cli-001/NEW/$($event.task_id).json"
                            }
                            "review.requested" {
                                Write-Log "Review requested for: $($event.file_path)"
                            }
                            "agent.status_changed" {
                                Write-Log "Agent $($event.agent_id) status: $($event.status)"
                                # Update shared state
                                $state = Get-Content ".openclaw/shared-state.json" | ConvertFrom-Json
                                $state.agent_states.$($event.agent_id).status = $event.status
                                $state.agent_states.$($event.agent_id).last_ping = Get-Date -Format "o"
                                $state | ConvertTo-Json -Depth 5 | Out-File ".openclaw/shared-state.json"
                            }
                            default {
                                Write-Log "Unhandled event type: $($event.type)"
                            }
                        }
                        
                        $response.StatusCode = 200
                        $responseContent = '{"status":"received"}'
                    } catch {
                        Write-Log "Error processing webhook: $_"
                        $response.StatusCode = 400
                        $responseContent = '{"error":"invalid_payload"}'
                    }
                } else {
                    $response.StatusCode = 405
                    $responseContent = '{"error":"method_not_allowed"}'
                }
            }
            
            "/health" {
                $response.StatusCode = 200
                $health = @{
                    status = "healthy"
                    timestamp = Get-Date -Format "o"
                    uptime = (Get-Date) - $startTime
                } | ConvertTo-Json
                $responseContent = $health
            }
            
            "/status" {
                $response.StatusCode = 200
                $state = Get-Content ".openclaw/shared-state.json" | ConvertFrom-Json
                $responseContent = $state | ConvertTo-Json -Depth 5
            }
            
            default {
                $response.StatusCode = 404
                $responseContent = '{"error":"not_found"}'
            }
        }
        
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseContent)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
    Write-Log "Webhook server stopped"
}
