# Release a lock on a file
param(
    [Parameter(Mandatory=$true)]
    [string]$AgentId,
    
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

$safeName = $FilePath -replace '[\/\\]', '_'
$lockFile = ".agents/active/$AgentId/locks/${safeName}.json"

if (Test-Path $lockFile) {
    Remove-Item $lockFile
    Write-Host "🔓 Lock released on $FilePath" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No lock found for $FilePath" -ForegroundColor Yellow
}
