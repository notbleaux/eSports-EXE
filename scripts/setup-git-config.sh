#!/bin/bash
# Setup Git Configuration for NJZ Platform
# Configures commit template and other git settings

echo "Setting up git configuration for NJZ Platform..."

# Set commit template
git config commit.template .gitmessage
echo "✅ Commit template configured: .gitmessage"

# Enable signoffs for traceability
git config format.signoff true
echo "✅ Signoffs enabled"

# Set default editor for multi-line commits (optional)
# Uncomment and modify as needed:
# git config core.editor "code --wait"  # VS Code
# git config core.editor "vim"          # Vim
# git config core.editor "nano"         # Nano

# Configure pull to use rebase (for linear history)
git config pull.rebase true
echo "✅ Pull rebase enabled (for linear history)"

# Configure push to use simple mode
git config push.default simple

# Show current config
echo ""
echo "Current git configuration:"
echo "--------------------------"
git config --list | grep -E "(commit.template|format.signoff|pull.rebase|core.editor)"

echo ""
echo "Git configuration complete!"
echo ""
echo "To use the commit template:"
echo "  git commit  # Will open editor with template"
echo ""
echo "To bypass the template for quick commits:"
echo "  git commit -m 'type(scope): message'"
