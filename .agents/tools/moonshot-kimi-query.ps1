param(
    [string]$Prompt,
    [string]$Model = \"kimi-thinking-2.5\"
)

\$apiKey = \$env:MOONSHOT_API_KEY
if (!\$apiKey) { Write-Error \"Set MOONSHOT_API_KEY\"; return }

\$body = @{
    model = \$Model
    messages = @(
        @{
            role = \"user\"
            content = \$Prompt
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri \"https://api.moonshot.cn/v1/chat/completions\" -Method Post -Body \$body -Headers @{
    Authorization = \"Bearer \$apiKey\"
    \"Content-Type\" = \"application/json\"
} | Select -Expand response -Expand choices | Select -Expand message -Expand content
