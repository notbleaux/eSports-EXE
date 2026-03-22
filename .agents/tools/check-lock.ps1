param(
    [string]$FilePath
)

$lockFile = \".agents/active/*/locks/$(Get-FileHash $FilePath | Select -Expand Hash).json\"

if (Test-Path $lockFile) {
    Get-Content $lockFile | ConvertFrom-Json | Select AgentId, Timestamp, Reason
} else {
    Write-Output \"No lock found for $FilePath\"
}
