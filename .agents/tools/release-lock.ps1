param(
    [string]$AgentId,
    [string]$FilePath
)

$lockHash = (Get-FileHash $FilePath).Hash
$lockFile = \".agents/active/$AgentId/locks/$lockHash.json\"

if (Test-Path $lockFile) {
    Remove-Item $lockFile
    Write-Output \"Lock released for \$FilePath\"
} else {
    Write-Warning \"No lock found for \$AgentId on \$FilePath\"
}
