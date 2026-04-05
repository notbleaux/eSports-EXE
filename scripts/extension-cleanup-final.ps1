# ============================================================
# NJZITEGEIST PLATFORM — FINAL EXTENSION CLEANUP
# Removes 13 extensions per user specification
# ============================================================

param(
    [switch]$WhatIf,
    [switch]$Force
)

$ErrorActionPreference = "Continue"
$removed = @()
$failed = @()
$notFound = @()

# Extensions to remove (13 total)
$removals = @(
    # User Approved / Container & Infrastructure
    "ms-azuretools.vscode-containers",          # Container Tools - Docker sufficient
    "yamapan.m365-update",                      # M365 UPDATE MCP - not dev-related
    "mcpsearchtool.mcp-search-tool",            # MCP Search Tool - MCP Store better
    "thomasfindelkind.redis-best-practices-mcp", # Redis Best Practices - standard Redis ext sufficient
    
    # MCP Specialized / Niche
    "dmitryborozdin.xsd-diagram-mcp",           # XSD Diagram MCP - XML niche
    "fabioc-aloha.youtube-mcp-tools",           # YouTube MCP - not dev-related
    
    # Languages Not In Stack
    "julialang.language-julia",                 # Julia - not in project stack
    "reditorsupport.r",                         # R - not in project stack
    "reditorsupport.r-syntax",                  # R Syntax - not in project stack
    "rdebugger.r-debugger",                     # R Debugger - not in project stack
    
    # Specialized / Niche
    "multifactorai.mfcli-mcp",                  # Multifactor Hardware Engineering - extremely niche
    "ayesha-241419.atomic-tree-engine",         # Atomic Tree Engine - overlaps with other memory
    "vasudev-jaiswal.mnemosynth"                # MNEMOSYNTH - experimental/buggy
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EXTENSION CLEANUP - FINAL PHASE" -ForegroundColor Cyan
Write-Host "  Target: 13 extensions" -ForegroundColor Cyan
Write-Host "  Mode: $(if ($WhatIf) { 'PREVIEW (WhatIf)' } else { 'LIVE' })" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get currently installed extensions
$installed = code --list-extensions

foreach ($ext in $removals) {
    # Check if extension is installed
    $isInstalled = $installed | Select-String -Pattern "^$ext$"
    
    if (-not $isInstalled) {
        Write-Host "⏭️  SKIP (not installed): $ext" -ForegroundColor Gray
        $notFound += $ext
        continue
    }
    
    Write-Host "🗑️  REMOVING: $ext" -ForegroundColor Yellow
    
    if ($WhatIf) {
        Write-Host "   [WHATIF] Would remove: $ext" -ForegroundColor Cyan
        $removed += $ext
        continue
    }
    
    try {
        $output = code --uninstall-extension $ext 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host "   ✅ Removed successfully" -ForegroundColor Green
            $removed += $ext
        } else {
            Write-Host "   ⚠️  Exit code $exitCode : $output" -ForegroundColor Yellow
            $failed += $ext
        }
    } catch {
        Write-Host "   ❌ Error: $_" -ForegroundColor Red
        $failed += $ext
    }
    
    # Rate limiting to avoid overwhelming VS Code:
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Removed: $($removed.Count) / $($removals.Count)" -ForegroundColor Green
Write-Host "Failed: $($failed.Count)" -ForegroundColor $(if ($failed.Count -gt 0) { "Red" } else { "Green" })
Write-Host "Not Found (already removed): $($notFound.Count)" -ForegroundColor Gray
Write-Host ""

if ($removed.Count -gt 0) {
    Write-Host "Successfully removed:" -ForegroundColor Green
    $removed | ForEach-Object { Write-Host "  ✅ $_" -ForegroundColor Green }
}

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "Failed to remove:" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "  ❌ $_" -ForegroundColor Red }
}

if ($notFound.Count -gt 0) {
    Write-Host ""
    Write-Host "Already removed (not found):" -ForegroundColor Gray
    $notFound | ForEach-Object { Write-Host "  ⏭️  $_" -ForegroundColor Gray }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Reload VS Code: to complete cleanup:" -ForegroundColor White
Write-Host "     Ctrl+Shift+P → 'Developer: Reload Window'" -ForegroundColor White
Write-Host ""
Write-Host "  2. Verify remaining extensions:" -ForegroundColor White
Write-Host "     code --list-extensions | Measure-Object" -ForegroundColor White
Write-Host ""
Write-Host "  3. Expected final count: ~104 extensions" -ForegroundColor White
