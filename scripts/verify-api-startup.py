#!/usr/bin/env python3
"""
[Ver001.002] — API Startup Verification Script
Tests that the API can start and respond to health checks
Used for Render deployment validation

Usage:
  PYTHONPATH=packages/shared python scripts/verify-api-startup.py
"""

import sys
import os

# Add the shared packages to path (simulates Render's PYTHONPATH)
script_dir = os.path.dirname(os.path.abspath(__file__))
shared_path = os.path.join(script_dir, "..", "packages", "shared")
sys.path.insert(0, os.path.abspath(shared_path))

# Add the API directory to path
api_path = os.path.join(shared_path, "api")
sys.path.insert(0, api_path)

# Unicode checkmarks (avoid Windows encoding issues)
CHECK = "[OK]"
CROSS = "[FAIL]"

def test_imports():
    """Test that all required modules can be imported."""
    print("Testing API imports...")
    
    errors = []
    
    try:
        from main import app
        print(f"  {CHECK} main.py imports successfully")
    except Exception as e:
        errors.append(f"  {CROSS} main.py import failed: {e}")
    
    try:
        from src.tokens.token_routes import router
        print(f"  {CHECK} token_routes imports successfully")
    except Exception as e:
        errors.append(f"  {CROSS} token_routes import failed: {e}")
    
    try:
        from src.auth.auth_routes import router
        print(f"  {CHECK} auth_routes imports successfully")
    except Exception as e:
        errors.append(f"  {CROSS} auth_routes import failed: {e}")
    
    try:
        from src.sator.routes import router
        print(f"  {CHECK} sator_routes imports successfully")
    except Exception as e:
        errors.append(f"  {CROSS} sator_routes import failed: {e}")
    
    if errors:
        print("\nImport Errors:")
        for error in errors:
            print(error)
        return False
    
    return True

def test_fastapi_app():
    """Test that FastAPI app can be created."""
    print("\nTesting FastAPI app creation...")
    
    try:
        from main import app
        
        # Check app properties
        assert app.title == "SATOR Esports API", f"Unexpected title: {app.title}"
        assert app.version == "2.1.0", f"Unexpected version: {app.version}"
        
        # Check routes
        routes = [route.path for route in app.routes]
        assert "/health" in routes, "/health endpoint not found"
        
        print(f"  {CHECK} FastAPI app created successfully")
        print(f"    Title: {app.title}")
        print(f"    Version: {app.version}")
        print(f"    Routes: {len(routes)} registered")
        
        return True
    except Exception as e:
        print(f"  {CROSS} FastAPI app test failed: {e}")
        return False

def test_health_endpoint():
    """Test the health endpoint logic."""
    print("\nTesting health endpoint...")
    
    try:
        from main import health_check
        import asyncio
        
        # Run the async health check
        result = asyncio.run(health_check())
        
        assert result["status"] == "healthy", f"Unexpected status: {result['status']}"
        assert result["service"] == "sator-api", f"Unexpected service: {result['service']}"
        
        print(f"  {CHECK} Health endpoint returns valid response")
        print(f"    Status: {result['status']}")
        print(f"    Service: {result['service']}")
        print(f"    Version: {result['version']}")
        
        return True
    except Exception as e:
        print(f"  {CROSS} Health endpoint test failed: {e}")
        return False

def main():
    """Run all verification tests."""
    print("=" * 60)
    print("SATOR API Startup Verification")
    print("=" * 60)
    print(f"\nPYTHONPATH set to: {shared_path}")
    print("")
    
    tests = [
        ("Imports", test_imports),
        ("FastAPI App", test_fastapi_app),
        ("Health Endpoint", test_health_endpoint),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"  {CROSS} {name} test crashed: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 60)
    print("Verification Results")
    print("=" * 60)
    
    all_passed = True
    for name, result in results:
        status = "PASS" if result else "FAIL"
        symbol = CHECK if result else CROSS
        print(f"{symbol} {name}: {status}")
        if not result:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print(f"\n{CHECK} All verification tests passed!")
        print("API is ready for deployment.")
        return 0
    else:
        print(f"\n{CROSS} Some verification tests failed.")
        print("Please fix the issues before deploying.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
