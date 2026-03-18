 # Test Kimi ACP Connection
\$response = Invoke-WebRequest -Uri \"http://localhost:8080/health\" -UseBasicParsing -TimeoutSec 5
Write-Output \"ACP Status: \$(\$response.StatusCode)\"

