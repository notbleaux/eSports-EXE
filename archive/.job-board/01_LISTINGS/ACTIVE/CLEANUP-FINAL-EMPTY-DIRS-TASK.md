[Ver001.000]

# TASK: Final Empty Directory Cleanup
## Sub-Agent Assignment - Wave FINAL-1

**Priority:** P0  
**Estimated Duration:** 1 hour  
**Agent:** CL-FINAL-1-{ID}  
**Assigned By:** SATUR

---

## Objective

Remove ALL remaining empty directories from the JLB. Current count: 55 empty directories.

---

## Background

Previous cleanup waves removed 32+ empty directories. This task completes the cleanup by removing the remaining 55 empty directories scattered throughout the JLB structure.

---

## Task Details

### Scope
Remove empty directories from the following locations:

1. **02_CLAIMED/** subdirectories
   - Check all TL-* directories for empty AGENT-* subdirs
   - Remove empty AGENT-* directories
   - If parent TL-* directory becomes empty, remove it too

2. **03_COMPLETED/** subdirectories
   - Check WAVE_* directories for empty agent directories
   - Remove empty agent directories

3. **03_ONGOING/** subdirectories
   - Check WAVE_1_3 agent directories (12 directories)
   - These should be kept but verified they have content

4. **06_TEAM_LEADERS/** subdirectories
   - Check for empty AGENT-* directories
   - Remove if empty

5. **Other locations**
   - Check 04_BLOCKS/
   - Check 08_SAF_COUNCIL/
   - Any other empty directories found

---

## Procedure

### Step 1: Discovery
```powershell
# Find all empty directories
Get-ChildItem .job-board -Recurse -Directory | Where-Object { 
    (Get-ChildItem $_.FullName -Recurse -File).Count -eq 0 
}
```

### Step 2: Safe Removal
For each empty directory:
1. Verify no files exist (double-check)
2. Check directory age (if > 24 hours, safe to remove)
3. Remove directory
4. Log action

### Step 3: Verification
After removal:
1. Re-scan for empty directories
2. Confirm count = 0
3. Generate completion report

---

## Success Criteria

- [ ] ALL empty directories removed (target: 0)
- [ ] No accidental deletion of files
- [ ] Completion report generated
- [ ] Verification scan shows 0 empty directories

---

## Deliverables

1. **CL-FINAL-1-{ID}_COMPLETION_REPORT.md**
   - List of directories removed
   - Before/after counts
   - Any issues encountered

---

## Safety Requirements

⚠️ **CRITICAL:**
- Double-check each directory is truly empty
- Do NOT remove directories containing files
- Do NOT remove 03_ONGOING/WAVE_1_3/* (these are active)
- Do NOT remove FRAMEWORK/, TEMPLATES/, or README files

---

## Command Reference

```powershell
# Safe empty directory removal
$dirs = Get-ChildItem .job-board -Recurse -Directory | Where-Object { 
    (Get-ChildItem $_.FullName -Recurse -File).Count -eq 0 
}

foreach ($dir in $dirs) {
    # Final verification
    $files = Get-ChildItem $dir.FullName -Recurse -File
    if ($files.Count -eq 0) {
        Remove-Item $dir.FullName -Recurse -Force
        Write-Host "Removed: $($dir.FullName)"
    }
}
```

---

## Sign-off

**Assigned By:** SATUR  
**Date:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  
**Expected Completion:** Within 1 hour of assignment

---

*This task completes the empty directory cleanup objective.*
