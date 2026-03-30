#!/bin/bash
# TS6133 batch fix script - identifies files with unused variables

cd /root/.openclaw/workspace/eSports-EXE/apps/web

# Get list of files with TS6133 errors, sorted by count
./node_modules/.bin/tsc --noEmit 2>&1 | \
  grep "error TS6133" | \
  sed 's/(.*//; s/:.*//' | \
  sort | uniq -c | \
  sort -rn | \
  head -50
