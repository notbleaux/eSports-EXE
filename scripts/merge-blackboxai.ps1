git checkout main
git pull origin main
git merge blackboxai/extensions-mcp-kimi-setup
git push origin main
git branch -d blackboxai/extensions-mcp-kimi-setup
Write-Output "Merged! Clean codebase."
