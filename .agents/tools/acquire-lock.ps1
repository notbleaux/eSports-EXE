param(
    [string]$AgentId,
    [string]$FilePath,
    [string]$Reason
)

$lockHash = (Get-FileHash $FilePath).Hash
$lockDir = \".agents/active/$AgentId/locks\"
$lockFile = \"$lockDir/$lockHash.json\"

if (!(Test-Path $lockDir)) { New-Item -ItemType Directory -Path $lockDir -Force }

if (Test-Path $lockFile) {
    Write-Error \"Lock already exists for $FilePath\"
} else {
    @{
        AgentId = $AgentId
        FilePath = $FilePath
        Timestamp = Get-Date -Format \"yyyy-MM-dd HH:mm:ss\"
        Reason = $Reason
        Expires = (Get-Date).AddMinutes(30).ToString(\"yyyy-MM-dd HH:mm:ss\")
    } | ConvertTo-Json | Set-Content $lockFile
    Write-Output \"Lock acquired on $FilePath\"
}
