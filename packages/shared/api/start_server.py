#!/usr/bin/env python3
"""
SATOR API Server Launcher
=========================
Properly configures Python path before starting the API.
This handles the relative import issues with axiom_esports_data.
"""

import sys
import os

# Get the directory containing this script (api/)
api_dir = os.path.dirname(os.path.abspath(__file__))

# Add parent directory (shared/) to path for axiom_esports_data imports
shared_dir = os.path.dirname(api_dir)
if shared_dir not in sys.path:
    sys.path.insert(0, shared_dir)

# Add api directory for src imports
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

# Now import and run main
from main import app
import uvicorn

if __name__ == "__main__":
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    reload = os.getenv("API_RELOAD", "false").lower() == "true"
    
    print(f"Starting SATOR API on http://{host}:{port}")
    print(f"Documentation: http://{host}:{port}/docs")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
    )
