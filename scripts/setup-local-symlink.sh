#!/bin/bash
# [Ver001.000]
# Setup local symlink for axiom-esports-data package
# Run this before local development/testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_PATH="$SCRIPT_DIR/../packages/shared"
TARGET="$SHARED_PATH/axiom-esports-data"
LINK="$SHARED_PATH/axiom_esports_data"

echo "Setting up symlink for axiom package..."
echo "  Target: $TARGET"
echo "  Link: $LINK"

if [ -L "$LINK" ]; then
    echo "Symlink already exists, removing..."
    rm "$LINK"
elif [ -d "$LINK" ]; then
    echo "Directory exists at link path, removing..."
    rm -rf "$LINK"
fi

# Create symlink
ln -s "$TARGET" "$LINK"

echo "Symlink created successfully!"
echo ""
echo "You can now run the API with:"
echo "  cd packages/shared/api"
echo "  export PYTHONPATH=../../"
echo "  uvicorn main:app --reload"
