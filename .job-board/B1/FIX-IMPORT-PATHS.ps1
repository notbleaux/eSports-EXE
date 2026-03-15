# [Ver001.000]
# Fix Import Path Script for SATOR API
# Run this script with Administrator privileges
#
# This script creates a symbolic link to fix the import path issue where
# Python code imports from 'axiom_esports_data' but the directory is
# named 'axiom-esports-data' (hyphens can't be used in Python imports)

param(
    [switch]$CreateSymlink,
    [switch]$VerifyOnly,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
SATOR API Import Path Fix Script
=================================

This script fixes the import path issue where Python modules reference
'axiom_esports_data' but the actual directory is 'axiom-esports-data'.

USAGE:
    .\FIX-IMPORT-PATHS.ps1 -CreateSymlink    # Create the symbolic link (requires Admin)
    .\FIX-IMPORT-PATHS.ps1 -VerifyOnly       # Check if the issue exists
    .\FIX-IMPORT-PATHS.ps1 -Help             # Show this help

ISSUE DESCRIPTION:
    Multiple API files import from 'axiom_esports_data' (underscore):
        from ...axiom_esports_data.api.src.db_manager import db
    
    But the actual directory is 'axiom-esports-data' (hyphen):
        packages/shared/axiom-esports-data/
    
    Python cannot import from hyphenated directory names because hyphens
    are interpreted as minus operators.

FIX:
    Creates a symbolic link 'axiom_esports_data' -> 'axiom-esports-data'
    in the packages/shared directory.

ALTERNATIVE FIXES (if symlink not possible):
    1. Rename the directory to use underscores
    2. Use PYTHONPATH environment variable
    3. Create a .pth file in site-packages
"@
    exit
}

$ErrorActionPreference = "Stop"

# Determine the correct path
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $scriptPath) {
    $scriptPath = Get-Location
}

# Navigate to packages/shared
$targetDir = Join-Path $scriptPath "..\..\packages\shared"
$targetDir = Resolve-Path $targetDir

Write-Host "Target Directory: $targetDir" -ForegroundColor Cyan

# Check if the directories exist
$hyphenDir = Join-Path $targetDir "axiom-esports-data"
$underscoreDir = Join-Path $targetDir "axiom_esports_data"

$hyphenExists = Test-Path $hyphenDir -PathType Container
$underscoreExists = Test-Path $underscoreDir

Write-Host ""
Write-Host "Status Check:" -ForegroundColor Cyan
Write-Host "  axiom-esports-data (actual dir): $(if ($hyphenExists) { 'EXISTS' } else { 'MISSING' })" -ForegroundColor $(if ($hyphenExists) { 'Green' } else { 'Red' })
Write-Host "  axiom_esports_data (symlink): $(if ($underscoreExists) { 'EXISTS' } else { 'MISSING' })" -ForegroundColor $(if ($underscoreExists) { 'Green' } else { 'Yellow' })

if ($VerifyOnly) {
    Write-Host ""
    Write-Host "Verification Mode - No changes made." -ForegroundColor Cyan
    exit
}

if (-not $hyphenExists) {
    Write-Error "ERROR: axiom-esports-data directory not found at $hyphenDir"
    exit 1
}

if ($underscoreExists) {
    Write-Host ""
    Write-Host "Symbolic link already exists. No action needed." -ForegroundColor Green
    exit 0
}

if (-not $CreateSymlink) {
    Write-Host ""
    Write-Warning "Import path issue detected but -CreateSymlink not specified."
    Write-Host "Run with -CreateSymlink to fix (requires Administrator privileges)." -ForegroundColor Yellow
    exit 1
}

# Create the symbolic link
Write-Host ""
Write-Host "Creating symbolic link..." -ForegroundColor Cyan

try {
    New-Item -ItemType SymbolicLink -Path $underscoreDir -Target $hyphenDir -ErrorAction Stop
    Write-Host "SUCCESS: Symbolic link created!" -ForegroundColor Green
    Write-Host "  $underscoreDir -> $hyphenDir"
} catch [System.UnauthorizedAccessException] {
    Write-Error @"
ACCESS DENIED: Administrator privileges required to create symbolic links.

Options:
1. Run PowerShell as Administrator and try again:
   - Right-click PowerShell -> "Run as Administrator"
   - cd to this directory
   - Run: .\FIX-IMPORT-PATHS.ps1 -CreateSymlink

2. Use alternative fix (rename directory):
   - Rename 'axiom-esports-data' to 'axiom_esports_data'
   - Update all references in documentation

3. Use PYTHONPATH workaround:
   - Set environment variable before running:
     $env:PYTHONPATH = "C:\path\to\packages\shared\axiom-esports-data"
"@
    exit 1
} catch {
    Write-Error "Failed to create symbolic link: $_"
    exit 1
}

Write-Host ""
Write-Host "Verification:" -ForegroundColor Cyan
Write-Host "  Symbolic link created successfully!"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Restart your FastAPI application"
Write-Host "  2. Test authentication endpoints"
Write-Host "  3. Run: pytest tests/integration/test_api_firewall.py"
