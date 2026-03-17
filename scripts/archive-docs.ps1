# Archive old documentation files
# Keeps only essential files, moves everything else to archive/

$essentialFiles = @(
    "README.md",
    "AGENTS.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    "LICENSE"
)

$archiveDir = "archive/docs"

# Create archive directory if not exists
New-Item -ItemType Directory -Force -Path $archiveDir

# Get all .md files in root
$mdFiles = Get-ChildItem -Filter "*.md"

foreach ($file in $mdFiles) {
    if ($essentialFiles -contains $file.Name) {
        Write-Host "KEEP: $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "ARCHIVE: $($file.Name)" -ForegroundColor Yellow
        Move-Item $file.FullName $archiveDir/
    }
}

Write-Host "`nArchiving complete!" -ForegroundColor Cyan
Write-Host "Essential files kept: $($essentialFiles.Count)" -ForegroundColor Green
Write-Host "Files archived: $(@(Get-ChildItem $archiveDir -Filter '*.md').Count)" -ForegroundColor Yellow
