# VS Code: ACP Extension Setup Script
# Builds and installs the ACP client extension

param(
    [switch]$BuildOnly,
    [switch]$Install,
    [switch]$Dev
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

Write-Host @"
=============================================================
     VS Code: ACP Extension Setup
=============================================================
"@ -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n[1/5] Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "Node.js not found. Please install Node.js 18+"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "  ✓ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Error "npm not found"
    exit 1
}

# Check VS Code:
try {
    $codeVersion = code --version | Select-Object -First 1
    Write-Host "  ✓ VS Code:: $codeVersion" -ForegroundColor Green
} catch {
    Write-Warning "  ⚠ VS Code: CLI not found. Extension installation will be manual."
}

# Check if we're in the right directory
if (-not (Test-Path "$scriptDir/vscode-extension.ts")) {
    Write-Error "vscode-extension.ts not found. Run this script from the .openclaw directory."
    exit 1
}

# Install dependencies
Write-Host "`n[2/5] Installing dependencies..." -ForegroundColor Yellow
Set-Location $scriptDir

# Create package.json from template
Write-Host "  Creating package.json..." -ForegroundColor Gray
Copy-Item "$scriptDir/package-vscode.json" "$scriptDir/package.json" -Force

# Install npm packages
Write-Host "  Running npm install..." -ForegroundColor Gray
npm install 2>&1 | Select-Object -Last 5

if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install failed"
    exit 1
}
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

# Compile TypeScript
Write-Host "`n[3/5] Compiling TypeScript..." -ForegroundColor Yellow
npm run compile 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Warning "TypeScript compilation had errors, but continuing..."
} else {
    Write-Host "  ✓ Compilation successful" -ForegroundColor Green
}

# Check output
if (Test-Path "$scriptDir/out/vscode-extension.js") {
    Write-Host "  ✓ Extension JavaScript generated" -ForegroundColor Green
} else {
    Write-Error "Extension compilation failed - output not found"
    exit 1
}

if ($BuildOnly) {
    Write-Host "`n✓ Build complete. Extension ready at: $scriptDir" -ForegroundColor Green
    Write-Host "`nTo install manually:" -ForegroundColor Yellow
    Write-Host "  1. Open VS Code:" -ForegroundColor Gray
    Write-Host "  2. Go to Extensions view (Ctrl+Shift+X)" -ForegroundColor Gray
    Write-Host "  3. Click '...' menu → 'Install from VSIX...'" -ForegroundColor Gray
    Write-Host "  4. Or run: code --install-extension $scriptDir" -ForegroundColor Gray
    exit 0
}

# Package extension
Write-Host "`n[4/5] Packaging extension..." -ForegroundColor Yellow

# Install vsce if needed
if (-not (Get-Command vsce -ErrorAction SilentlyContinue)) {
    Write-Host "  Installing vsce..." -ForegroundColor Gray
    npm install -g @vscode/vsce 2>&1 | Out-Null
}

# Package
$vsixPath = "$projectRoot/vscode-acp-client.vsix"
vsce package --out $vsixPath 2>&1 | Select-Object -Last 3

if (Test-Path $vsixPath) {
    Write-Host "  ✓ Extension packaged: $vsixPath" -ForegroundColor Green
} else {
    Write-Warning "  ⚠ Packaging may have failed, but extension can still be run in dev mode"
}

# Install extension
if ($Install -or $Dev) {
    Write-Host "`n[5/5] Installing extension..." -ForegroundColor Yellow
    
    if (Get-Command code -ErrorAction SilentlyContinue) {
        if ($Dev) {
            # Run in development mode
            Write-Host "  Starting VS Code: in development mode..." -ForegroundColor Gray
            code --extensionDevelopmentPath=$scriptDir $projectRoot
        } else {
            # Install VSIX
            if (Test-Path $vsixPath) {
                Write-Host "  Installing VSIX..." -ForegroundColor Gray
                code --install-extension $vsixPath --force 2>&1
                Write-Host "  ✓ Extension installed" -ForegroundColor Green
            }
        }
    } else {
        Write-Warning "  ⚠ VS Code: CLI not available. Install manually from: $vsixPath"
    }
}

# Summary
Write-Host @"

=============================================================
     Setup Complete!
=============================================================

Extension location: $scriptDir
Package location:   $vsixPath

Available Commands (press Ctrl+Shift+P):
  • ACP: Start Kimi Agent
  • ACP: Start OpenClaw Bridge
  • ACP: Open Chat
  • ACP: Send Prompt
  • ACP: Set Mode
  • ACP: Stop Agent

Keyboard Shortcut:
  Ctrl+Shift+A - Open ACP Chat

Next Steps:
  1. Press F5 to run extension in debug mode (if in VS Code:)
  2. Or install the .vsix file manually
  3. Start an agent with "ACP: Start Kimi Agent"

=============================================================
"@ -ForegroundColor Cyan

Set-Location $projectRoot
