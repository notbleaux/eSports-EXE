# Send a message to another agent via file-based messaging
param(
    [Parameter(Mandatory=$true)]
    [string]$From,
    
    [Parameter(Mandatory=$true)]
    [string]$To,
    
    [Parameter(Mandatory=$true)]
    [string]$Message,
    
    [string]$Channel = "broadcast"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$messageFile = ".agents/channels/$Channel/MSG-${From}-${To}-${timestamp}.json"

$messageObj = @{
    id = [Guid]::NewGuid().ToString()
    from = $From
    to = $To
    timestamp = Get-Date -Format "o"
    message = $Message
    channel = $Channel
} | ConvertTo-Json -Depth 3

$messageObj | Out-File -FilePath $messageFile -Encoding UTF8
Write-Host "✅ Message sent to $Channel channel" -ForegroundColor Green
Write-Host "   File: $messageFile" -ForegroundColor Gray
