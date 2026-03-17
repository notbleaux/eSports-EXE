# Check if a file is locked by another agent
param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

$locksDir = ".agents/active/*/locks"
$safeName = $FilePath -replace '[\/\\]', '_'
$lockFiles = Get-ChildItem -Path $locksDir -Filter "*$safeName*" -ErrorAction SilentlyContinue

if ($lockFiles) {
    Write-Host "⚠️  FILE LOCKED" -ForegroundColor Red
    foreach ($lock in $lockFiles) {
        $content = Get-Content $lock.FullName | ConvertFrom-Json
        Write-Host "  Agent: $($content.agentId)" -ForegroundColor Yellow
        Write-Host "  Since: $($content.acquiredAt)" -ForegroundColor Yellow
        Write-Host "  Until: $($content.expiresAt)" -ForegroundColor Yellow
        Write-Host "  Reason: $($content.reason)" -ForegroundColor Gray
    }
    exit 1
} else {
    Write-Host "✅ File is not locked" -ForegroundColor Green
    exit 0
}
