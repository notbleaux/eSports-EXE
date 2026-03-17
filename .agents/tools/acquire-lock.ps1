# Acquire a lock on a file
param(
    [Parameter(Mandatory=$true)]
    [string]$AgentId,
    
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    
    [string]$Reason = "File modification",
    
    [string]$TaskId = ""
)

# Check if already locked
$safeName = $FilePath -replace '[\/\\]', '_'
$existingLocks = Get-ChildItem -Path ".agents/active/*/locks" -Filter "*$safeName*" -ErrorAction SilentlyContinue

if ($existingLocks) {
    $content = Get-Content $existingLocks[0].FullName | ConvertFrom-Json
    if ($content.agentId -ne $AgentId) {
        Write-Host "❌ File already locked by $($content.agentId)" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "ℹ️  Lock already held by you (refreshing)" -ForegroundColor Yellow
    }
}

# Create lock
$lockDir = ".agents/active/$AgentId/locks"
$lockFile = "$lockDir/${safeName}.json"

$lock = @{
    lockId = [Guid]::NewGuid().ToString()
    agentId = $AgentId
    filePath = $FilePath
    acquiredAt = Get-Date -Format "o"
    expiresAt = (Get-Date).AddMinutes(30).ToString("o")
    reason = $Reason
    taskId = $TaskId
} | ConvertTo-Json -Depth 3

$lock | Out-File -FilePath $lockFile -Encoding UTF8
Write-Host "🔒 Lock acquired on $FilePath" -ForegroundColor Green
Write-Host "   Expires: $($lock.expiresAt)" -ForegroundColor Gray
