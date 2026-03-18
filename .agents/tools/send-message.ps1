param(
    [string]$From,
    [string]$To,
    [string]$Message,
    [string]$Channel = \"broadcast\"
)

$msgDir = \".agents/channels/$Channel\"
if (!(Test-Path $msgDir)) { New-Item -ItemType Directory -Path $msgDir -Force }

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$msgFile = \"$msgDir/$timestamp`-$From-to-$To.md\"

@`
From: $From
To: $To
Timestamp: $(Get-Date)
Channel: $Channel

$Message
`@ | Out-File $msgFile

Write-Output \"Message sent to $To via $Channel\"


