#!/usr/bin/env powershell
# [Ver001.001]
# Setup local symlink for axiom-esports-data package
# Run this before local development/testing

$ErrorActionPreference = "Stop"

$sharedPath = Join-Path $PSScriptRoot ".." | Join-Path -ChildPath "packages" | Join-Path -ChildPath "shared"
$target = Join-Path $sharedPath "axiom-esports-data"
$link = Join-Path $sharedPath "axiom_esports_data"

Write-Host "Setting up symlink for axiom package..."
Write-Host "  Target: $target"
Write-Host "  Link: $link"

if (Test-Path $link) {
    Write-Host "Symlink already exists, removing..."
    Remove-Item $link -Recurse -Force
}

# Create junction on Windows (similar to symlink)
$null = New-Item -ItemType Junction -Path $link -Target $target

Write-Host "Symlink created successfully!"
Write-Host ""
Write-Host "You can now run the API with:"
Write-Host "  cd packages/shared/api"
Write-Host "  `$env:PYTHONPATH = '../../'"
Write-Host "  uvicorn main:app --reload"
