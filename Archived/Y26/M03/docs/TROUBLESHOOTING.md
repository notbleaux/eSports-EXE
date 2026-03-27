[Ver001.000]

# 🛠️ TROUBLESHOOTING.md
## Common Issues and Solutions

**Project:** NJZ Platform / SATOR-eXe-ROTAS  
**Last Updated:** March 7, 2026

---

## 🐛 Git Issues

### Issue: "fatal: not a git repository"
**Symptom:** Running git commands gives this error  
**Cause:** Not in a git repository directory  
**Solution:**
```bash
# Check current directory
pwd

# Navigate to repository
cd /path/to/eSports-EXE

# Verify .git exists
ls -la | grep .git
```

### Issue: "Permission denied" on push
**Symptom:** Cannot push to GitHub  
**Cause:** Authentication issue  
**Solution:**
```bash
# Check remote URL
git remote -v

# If HTTPS, check credentials
# If SSH, check SSH key: cat ~/.ssh/id_rsa.pub

# Re-authenticate with token if needed
```

### Issue: "Merge conflict"
**Symptom:** Git won't merge due to conflicting changes  
**Solution:**
```bash
# See conflicting files
git status

# Open each file and resolve conflicts (look for <<< HEAD)
# Then:
git add .
git commit -m "Resolve merge conflict"
```

### Issue: "Your branch is behind"
**Symptom:** Cannot push, need to pull first  
**Solution:**
```bash
# Pull latest changes
git pull origin main

# If conflicts, resolve them (see above)
# Then push:
git push origin main
```

---

## 💻 Development Issues

### Issue: "command not found: npm"
**Symptom:** npm commands don't work  
**Cause:** Node.js not installed  
**Solution:**
```bash
# Install Node.js from https://nodejs.org
# Or use package manager:
# macOS: brew install node
# Ubuntu: sudo apt install nodejs npm
```

### Issue: "npm install" fails
**Symptom:** Dependencies won't install  **Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Changes not showing up
**Symptom:** Edited file but website unchanged  
**Cause:** Need to rebuild/restart dev server  
**Solution:**
```bash
# Stop current server (Ctrl+C)
# Restart:
npm run dev
```

### Issue: Port already in use
**Symptom:** "Port 3000 is already in use"  
**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 [PID]

# Or use different port
npm run dev -- --port 3001
```

---

## 🌐 Website Issues

### Issue: Website shows old version
**Symptom:** Deployed changes not visible  
**Solution:**
1. Check deployment status on platform dashboard
2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
3. Check that correct branch was deployed

### Issue: 404 on refresh (SPA)
**Symptom:** Refreshing page gives 404  
**Cause:** Server not configured for Single Page Application  
**Solution:**
- Vercel: Add `vercel.json` with rewrites (already configured)
- Render: Add `_redirects` file
- GitHub Pages: Already handled by workflow

### Issue: API calls failing
**Symptom:** Data not loading from backend  
**Checklist:**
- [ ] API URL correct in environment variables
- [ ] Backend service is running
- [ ] CORS configured properly
- [ ] Network tab in DevTools shows the error

---

## 🔐 Authentication Issues

### Issue: GitHub token expired
**Symptom:** Git operations fail with auth error  
**Solution:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token
3. Update in your environment

### Issue: Cannot access repository
**Symptom:** 404 or permission denied  
**Check:**
- Repository URL is correct
- You have access permissions
- Repository is not private (or you have access)

---

## 📝 File Issues

### Issue: File too large for GitHub
**Symptom:** Push rejected due to file size  
**Solution:**
```bash
# Check large files
find . -type f -size +50M

# Remove from git history (if already committed)
git rm --cached [filename]

# Add to .gitignore
echo "[filename]" >> .gitignore

# Use Git LFS for large files
# Or store in cloud storage
```

### Issue: Accidentally deleted file
**Symptom:** Important file is gone  
**Solution:**
```bash
# If not yet committed
git checkout -- [filename]

# If already committed, restore from history
git log --diff-filter=D --summary  # Find deletion commit
git checkout [commit-before-deletion] -- [filename]
```

---

## 🤖 AI/Agent Issues

### Issue: Agent not responding
**Symptom:** Kimi or other AI not working  
**Solution:**
1. Check your token usage/billing
2. Try refreshing the page
3. Check if service is down (status page)
4. Try with simpler prompt

### Issue: Agent makes wrong changes
**Symptom:** AI modified wrong files  
**Solution:**
1. Review changes before committing (`git diff`)
2. Use `git checkout -- [file]` to revert
3. Be more specific in prompts
4. Work in smaller chunks

---

## 📊 Database Issues

### Issue: Database connection failed
**Symptom:** Cannot connect to database  **Checklist:**
- [ ] DATABASE_URL is set correctly
- [ ] Database service is running
- [ ] Credentials are correct
- [ ] Network allows connection

---

## 🆘 Emergency Recovery

### Nuclear Option: Start Fresh
If everything is broken:
```bash
# Keep your code, reset git
cd ..
mv eSports-EXE eSports-EXE-backup
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE

# Copy your changes from backup
cp -r ../eSports-EXE-backup/[your-changes] .
```

### Get Help
1. Check this troubleshooting guide
2. Search error message online
3. Ask in community forums
4. Open an issue on GitHub

---

## 🔍 Debugging Tips

### Always Check:
1. **Error message** — Read it carefully
2. **Logs** — Console output often explains the issue
3. **Recent changes** — What did you last modify?
4. **Documentation** — Check relevant docs in `docs/`

### Useful Commands:
```bash
# Check system info
node --version
npm --version
git --version

# Check git status
git status
git log --oneline -5

# Check disk space
df -h

# Check memory
free -m
```

---

## 📞 Still Stuck?

Resources:
- [CONTRIBUTING.md](./CONTRIBUTING.md) — General guidelines
- [GitHub Desktop User Guide](./docs/guides/GITHUB_DESKTOP_USER_GUIDE.md) — Git workflow
- GitHub Issues — Report problems
- Online search — Copy error message into search

---

*Last Updated: March 7, 2026*