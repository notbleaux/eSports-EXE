#!/usr/bin/env python3
"""Test script to verify all imports work before starting server."""

import sys
import os

# Set up paths like the server launcher does
api_dir = os.path.dirname(os.path.abspath(__file__))
shared_dir = os.path.dirname(api_dir)
if shared_dir not in sys.path:
    sys.path.insert(0, shared_dir)
if api_dir not in sys.path:
    sys.path.insert(0, api_dir)

print("Testing imports...")
print(f"Python path includes: {api_dir}")
print()

errors = []

try:
    print("1. Testing src.tokens...")
    from src.tokens import token_routes
    print("   OK - src.tokens.token_routes")
except Exception as e:
    print(f"   FAIL - src.tokens.token_routes: {e}")
    errors.append(("src.tokens", str(e)))

try:
    print("2. Testing src.forum...")
    from src.forum import forum_routes
    print("   OK - src.forum.forum_routes")
except Exception as e:
    print(f"   FAIL - src.forum.forum_routes: {e}")
    errors.append(("src.forum", str(e)))

try:
    print("3. Testing src.fantasy...")
    from src.fantasy import fantasy_routes
    print("   OK - src.fantasy.fantasy_routes")
except Exception as e:
    print(f"   FAIL - src.fantasy.fantasy_routes: {e}")
    errors.append(("src.fantasy", str(e)))

try:
    print("4. Testing src.challenges...")
    from src.challenges import challenge_routes
    print("   OK - src.challenges.challenge_routes")
except Exception as e:
    print(f"   FAIL - src.challenges.challenge_routes: {e}")
    errors.append(("src.challenges", str(e)))

try:
    print("5. Testing src.wiki...")
    from src.wiki import wiki_routes
    print("   OK - src.wiki.wiki_routes")
except Exception as e:
    print(f"   FAIL - src.wiki.wiki_routes: {e}")
    errors.append(("src.wiki", str(e)))

try:
    print("6. Testing src.opera...")
    from src.opera import opera_routes
    print("   OK - src.opera.opera_routes")
except Exception as e:
    print(f"   FAIL - src.opera.opera_routes: {e}")
    errors.append(("src.opera", str(e)))

try:
    print("7. Testing src.auth...")
    from src.auth import auth_routes
    print("   OK - src.auth.auth_routes")
except Exception as e:
    print(f"   FAIL - src.auth.auth_routes: {e}")
    errors.append(("src.auth", str(e)))

try:
    print("8. Testing src.sator...")
    from src.sator import routes
    print("   OK - src.sator.routes")
except Exception as e:
    print(f"   FAIL - src.sator.routes: {e}")
    errors.append(("src.sator", str(e)))

try:
    print("9. Testing axiom_esports_data...")
    from axiom_esports_data.api.src.db_manager import db
    print("   OK - axiom_esports_data.api.src.db_manager")
except Exception as e:
    print(f"   FAIL - axiom_esports_data.api.src.db_manager: {e}")
    errors.append(("axiom_esports_data", str(e)))

print()
if errors:
    print(f"ERRORS: {len(errors)} import(s) failed")
    for name, err in errors:
        print(f"  - {name}: {err}")
    sys.exit(1)
else:
    print("SUCCESS: All imports working!")
    print("The API should start without import errors.")
    sys.exit(0)
