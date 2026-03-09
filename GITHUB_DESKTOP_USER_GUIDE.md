[Ver003.000]

# GitHub Desktop User Guide
## For SATOR-eXe-ROTAS / NJZ Platform Project

**Purpose:** Step-by-step guide to using GitHub Desktop (no command line required)  
**Skill Level:** Beginner-friendly  
**Prerequisites:** GitHub account, GitHub Desktop installed

---

## 📥 Part 1: Installation & Setup

### Step 1: Download GitHub Desktop
1. Go to https://desktop.github.com/
2. Click "Download for Windows" (or Mac/Linux)
3. Run the installer
4. Open GitHub Desktop when installation completes

### Step 2: Sign In
1. Open GitHub Desktop
2. Click "Sign in to GitHub.com"
3. Enter your GitHub username and password
4. Authorize GitHub Desktop to access your account
5. Configure Git (name and email) when prompted

### Step 3: Set Up Your Repository

**Option A: Clone from GitHub (Recommended)**
1. Click "Clone a repository from the Internet..."
2. Select the "GitHub.com" tab
3. Find and select `notbleaux/eSports-EXE`
4. Choose where to save it on your computer (e.g., `C:\GitHUB\eSports-EXE`)
5. Click "Clone"

**Option B: Add Existing Local Repository**
1. If you already have the files: Click "Add an Existing Repository from your Hard Drive..."
2. Navigate to your project folder
3. Click "Add Repository"

---

## 🔄 Part 2: Daily Workflow

### Understanding the Interface

```
┌─────────────────────────────────────────────┐
│ GitHub Desktop                              │
├─────────────────────────────────────────────┤
│ Current Repository: eSports-EXE      [▼]    │
│ Current Branch: main                 [▼]    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ Changes (2)                           │  │
│  │                                       │  │
│  │ ➕ Added    AGENTS.md                 │  │
│  │ ✏️ Modified  README.md                 │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Summary (required)                         │
│  ┌───────────────────────────────────────┐  │
│  │ Update documentation                  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Description                                │
│  ┌───────────────────────────────────────┐  │
│  │ Added AGENTS.md with AI development   │  │
│  │ guidelines and updated README with    │  │
│  │ project overview.                     │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [☑️] Push changes to origin/main          │
│                                             │
│           [ Commit to main ]                │
│                                             │
└─────────────────────────────────────────────┘
```

### Step 4: Making Changes

**When you edit files:**
1. Edit files normally in VS Code or any editor
2. GitHub Desktop automatically detects changes
3. Changed files appear in the "Changes" list

**Icons explained:**
- ➕ **Yellow plus** = New file added
- ✏️ **Blue dot** = Existing file modified
- 🗑️ **Red minus** = File deleted

### Step 5: Reviewing Changes (CRITICAL)

**ALWAYS review before committing:**

1. Click on any file in the "Changes" list
2. See the diff (what changed) in the right panel:
   - Green lines = Added content
   - Red lines = Removed content
   - White lines = Unchanged context

**Why this matters:**
- Catch mistakes before they go live
- See exactly what the AI/agent changed
- Ensure no secrets or wrong files are included

**Red flags to watch for:**
- ❌ `.env` files with passwords
- ❌ `node_modules/` folders (should be in .gitignore)
- ❌ Files you didn't intend to change
- ❌ Thousands of lines changed unexpectedly

### Step 6: Writing Good Commit Messages

**The Commit Box:**
```
Summary (required) - Short, imperative mood
┌───────────────────────────────────────┐
│ Update agent framework documentation  │ ← 50 chars max
└───────────────────────────────────────┘

Description (optional but recommended) - What and why
┌───────────────────────────────────────┐
│ - Added AGENTS.md with development    │
│   guidelines                          │
│ - Updated README with architecture    │
│   overview                            │
│ - Fixed broken links in CONTRIBUTING  │
└───────────────────────────────────────┘
```

**BAD Examples (what NOT to do):**
- ❌ "yayooo"
- ❌ "hwhw"
- ❌ "sup"
- ❌ "idk yes"
- ❌ "changes"
- ❌ "update"

**GOOD Examples (what TO do):**
- ✅ "Add AGENTS.md with AI development guidelines"
- ✅ "Update README with architecture overview"
- ✅ "Fix broken links in CONTRIBUTING.md"
- ✅ "Migrate documentation from satorXrotas"
- ✅ "Add PATCH_REPORTS system for tracking changes"

**Template for AI/Agent work:**
```
Summary: [ACTION] [COMPONENT] - [BRIEF DESCRIPTION]

Description:
- [Specific change 1]
- [Specific change 2]
- [Specific change 3]

Source: [If from agent/AI, note it here]
```

### Step 7: Committing Changes

1. Review all changes (Step 5)
2. Write good summary (Step 6)
3. Write description if needed
4. Click **"Commit to main"** (or your branch name)

**What happens:**
- Changes are saved locally
- NOT yet on GitHub (just on your computer)
- You can make multiple commits before pushing

### Step 8: Pushing to GitHub

**After committing:**
1. Look for the "Push origin" button (top right)
2. It shows a number if you have commits to push
3. Click **"Push origin"**

**What happens:**
- Your commits go to GitHub.com
- Others can now see your changes
- The repository is updated

**Visual indicator:**
```
Before push: [ Push origin ↑2 ]  ← 2 commits waiting
After push:  [ Fetch origin ]    ← Up to date
```

---

## 📊 Part 3: Viewing History

### Seeing Past Commits

1. Click the **"History"** tab (top of window)
2. See all commits in chronological order
3. Click any commit to see what changed

**What you can do:**
- See who made changes and when
- View the exact changes in each commit
- Copy commit hashes
- Revert to previous versions

### Understanding Commit History

```
History - eSports-EXE

Today
├── 2:34 PM  Update agent framework documentation
│            You
│
├── 11:20 AM  Add PATCH_REPORTS system
│             You
│
Yesterday
├── 8:45 PM  [PATCH-001] MIGRATION initial repo merge
│            notbleaux
│
├── 3:20 PM  yayooo                    ← BAD COMMIT
│            hvrryh-web
│
March 4
├── 9:00 AM  Complete NJZ Quarter Grid Website
│            You
```

---

## ↩️ Part 4: Undoing Mistakes

### Scenario 1: Undo Uncommitted Changes

**You edited a file but haven't committed:**
1. Find the file in "Changes"
2. Right-click the file
3. Select **"Discard changes"**
4. File returns to last committed state

**⚠️ Warning:** This permanently deletes your changes!

### Scenario 2: Undo Last Commit (Keep Changes)

**You committed but want to change it:**
1. Go to "History"
2. Right-click the most recent commit
3. Select **"Revert this commit"**
4. Creates a new commit that undoes the changes

### Scenario 3: Rollback to Previous Version

**You want to go back to an older version:**
1. Go to "History"
2. Find the commit you want to return to
3. Right-click it
4. Select **"Revert this commit"**
5. This creates a new commit that undoes everything after that point

---

## 🌿 Part 5: Working with Branches

### What Are Branches?

Think of branches as parallel versions of your project:
- **main** — The stable, production version
- **develop** — Work in progress
- **feature-X** — Specific new feature

### Creating a New Branch

1. Click the current branch name (e.g., "main")
2. Click **"New Branch"**
3. Name it (e.g., "feature-navbar-update")
4. Click **"Create Branch"**

**Best Practice:** Create a new branch for:
- Major new features
- Experimental changes
- Changes you want to test before merging

### Switching Between Branches

1. Click the branch name
2. Select the branch you want
3. GitHub Desktop switches automatically

**What happens:**
- Files on your computer change to match that branch
- Uncommitted changes may cause conflicts

### Merging Branches

1. Finish your work on the feature branch
2. Commit all changes
3. Push the branch
4. Go to GitHub.com and create a Pull Request
5. Review and merge on GitHub
6. Back in GitHub Desktop, switch to main
7. Click **"Fetch origin"** to get the merged changes

---

## 🔄 Part 6: Staying in Sync

### Fetching Changes from GitHub

**When others (or you on another computer) make changes:**

1. Click **"Fetch origin"** (top right)
2. GitHub Desktop checks for new commits
3. If found, click **"Pull origin"**

**What happens:**
- Downloads new commits from GitHub
- Updates your local files
- May show conflicts if you edited the same files

### Handling Merge Conflicts

**If GitHub Desktop shows a conflict:**

1. It will show "Conflicted files"
2. Open each conflicted file in VS Code
3. Look for conflict markers:
   ```
   <<<<<<< HEAD
   Your changes
   =======
   Their changes
   >>>>>>> branch-name
   ```
4. Edit to keep what you want
5. Remove the conflict markers
6. Save the file
7. In GitHub Desktop, mark as resolved
8. Commit the merge

**Tip:** Conflicts are scary but normal. Just carefully choose which version to keep.

---

## ⚠️ Part 7: Common Mistakes & Solutions

### Problem 1: Committed a Secret

**Symptom:** You committed a file with a password or API key

**Solution:**
1. IMMEDIATELY change the password/API key on the service
2. Add the file to `.gitignore`
3. Use BFG Repo-Cleaner or contact GitHub Support to remove from history
4. Never commit `.env` files!

### Problem 2: Large Files in Repository

**Symptom:** Repository is slow, large files committed

**Solution:**
1. Add large files to `.gitignore`
2. Use Git LFS for files you must track
3. For already committed files, use BFG Repo-Cleaner

### Problem 3: Wrong Commit Message

**Symptom:** You wrote "yayooo" instead of a real message

**Solution:**
1. If not pushed yet:
   - History → Right-click commit → "Amend"
   - Edit the message → Commit
2. If already pushed:
   - Don't rewrite history on shared branches
   - Just write better messages going forward

### Problem 4: Can't Push

**Symptom:** "Push" button grayed out or error

**Solutions:**
1. Check internet connection
2. Fetch first (might need to pull changes first)
3. Check if you have write permissions
4. Verify you're signed in

### Problem 5: Accidentally Deleted File

**Symptom:** You deleted a file you need

**Solution:**
1. History → Find commit before deletion
2. Right-click file → "Revert this commit"
3. Or copy the file content from the diff view

---

## 🎯 Part 8: Best Practices Checklist

### Before Every Commit:
- [ ] Review all changed files
- [ ] Check no secrets are included
- [ ] Verify files are intended changes
- [ ] Write descriptive commit message
- [ ] Add description if change is complex

### Before Pushing:
- [ ] All commits are complete
- [ ] Commit messages are professional
- [ ] No work-in-progress code
- [ ] Tests pass (if applicable)

### Weekly Maintenance:
- [ ] Pull latest changes from GitHub
- [ ] Review commit history
- [ ] Clean up old branches
- [ ] Check for large files

---

## 🆘 Part 9: Getting Help

### In GitHub Desktop
- **Help menu** → "Show Logs" for troubleshooting
- **File** → "Options" for settings

### Online Resources
- GitHub Desktop Docs: https://docs.github.com/en/desktop
- GitHub Community: https://github.community/
- GitHub Support: https://support.github.com/

### For This Project
- Check `AGENTS.md` for AI collaboration guidelines
- Review `PATCH_REPORTS/` for change history
- See `REPOSITORY_TRANSFER_GUIDE.md` for project context

---

## 📝 Quick Reference Card

| Task | Action |
|------|--------|
| Download repo | Clone repository from GitHub.com |
| See what changed | Click on changed files in Changes tab |
| Save changes | Write summary → Commit to main |
| Upload to GitHub | Push origin button |
| See history | History tab |
| Undo last commit | History → Right-click → Revert |
| Get latest changes | Fetch origin → Pull origin |
| Create new branch | Branch menu → New Branch |

---

## ✅ Summary

**You now know how to:**
1. ✅ Install and set up GitHub Desktop
2. ✅ Clone your repository
3. ✅ See exactly what changed before committing
4. ✅ Write proper commit messages (not "yayooo")
5. ✅ Push changes to GitHub
6. ✅ View history and undo mistakes
7. ✅ Work with branches
8. ✅ Stay in sync with the repository

**Remember:**
- **Always review changes before committing**
- **Write descriptive commit messages**
- **Push regularly to back up your work**
- **Don't commit secrets or large files**

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-03-06  
**For Project:** SATOR-eXe-ROTAS / NJZ Platform  
**Classification:** User Guide