#!/usr/bin/env python3
[Ver001.000]
"""
Push Notification Test Script
=============================
Test the Web Push Protocol implementation.

Prerequisites:
    1. VAPID keys generated and in environment
    2. API server running
    3. Frontend subscribed to notifications

Usage:
    python scripts/test_push.py --help
    python scripts/test_push.py test-endpoint http://localhost:8000
    python scripts/test_push.py subscribe --user test_user
    python scripts/test_push.py send --user test_user --title "Hello" --body "Test message"
"""

import os
import sys
import json
import argparse
import requests
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

# Default API endpoint
DEFAULT_API_URL = os.getenv("API_URL", "http://localhost:8000")


def test_endpoint(base_url: str):
    """Test if the notification endpoint is accessible."""
    print("=" * 60)
    print("Testing Notification Endpoint")
    print("=" * 60)
    print(f"Base URL: {base_url}")
    print()
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"Health Check: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
        print()
    except Exception as e:
        print(f"Health check failed: {e}")
        print("Is the API server running?")
        return False
    
    # Test VAPID public key endpoint
    try:
        response = requests.get(f"{base_url}/api/notifications/vapid-public-key", timeout=10)
        print(f"VAPID Key Endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Public Key: {data.get('public_key', 'N/A')[:50]}...")
        else:
            print(f"Error: {response.text}")
        print()
    except Exception as e:
        print(f"VAPID key endpoint failed: {e}")
        return False
    
    # Test preferences endpoint (no auth required for now)
    try:
        response = requests.get(f"{base_url}/api/notifications/preferences", timeout=10)
        print(f"Preferences Endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error: {response.text}")
        print()
    except Exception as e:
        print(f"Preferences endpoint failed: {e}")
        return False
    
    print("All endpoints accessible!")
    return True


def subscribe_user(base_url: str, user_id: str, endpoint: str = None):
    """Simulate a subscription (for testing)."""
    print("=" * 60)
    print("Simulating Push Subscription")
    print("=" * 60)
    print(f"User: {user_id}")
    print()
    
    # Create a mock subscription
    mock_subscription = {
        "endpoint": endpoint or f"https://fcm.googleapis.com/fcm/send/mock-{user_id}",
        "keys": {
            "p256dh": "BNcRdreALRFXTk8VZ9K2z3dP4l5mN6oP7qR8sT9uV0wX1yZ2aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4mN5oP6qR7sT8uV9wX0yZ1aB2cD3eF4gH5iJ6",
            "auth": "tBHO7wLABC123XYZ789def456ghi012"
        },
        "user_agent": "TestAgent/1.0"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/notifications/subscribe",
            json={"subscription": mock_subscription},
            timeout=10
        )
        print(f"Subscribe Response: {response.status_code}")
        print(f"Body: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Subscribe failed: {e}")
        return False


def send_notification(
    base_url: str,
    user_id: str,
    title: str,
    body: str,
    category: str = "system"
):
    """Send a test notification."""
    print("=" * 60)
    print("Sending Test Notification")
    print("=" * 60)
    print(f"User: {user_id}")
    print(f"Title: {title}")
    print(f"Body: {body}")
    print(f"Category: {category}")
    print()
    
    try:
        response = requests.post(
            f"{base_url}/api/notifications/test",
            json={
                "user_id": user_id,
                "title": title,
                "body": body,
                "category": category
            },
            timeout=10
        )
        print(f"Response: {response.status_code}")
        print(f"Body: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Send notification failed: {e}")
        return False


def get_stats(base_url: str):
    """Get notification statistics."""
    print("=" * 60)
    print("Notification Statistics")
    print("=" * 60)
    
    try:
        response = requests.get(f"{base_url}/api/notifications/stats", timeout=10)
        print(f"Response: {response.status_code}")
        if response.status_code == 200:
            print(f"Stats: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Get stats failed: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Test Web Push Protocol implementation"
    )
    parser.add_argument(
        "--api-url", "-u",
        default=DEFAULT_API_URL,
        help=f"Base API URL (default: {DEFAULT_API_URL})"
    )
    parser.add_argument(
        "--user", "-U",
        default="test_user",
        help="User ID for testing"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Test endpoint command
    subparsers.add_parser("test-endpoint", help="Test if endpoints are accessible")
    
    # Subscribe command
    subscribe_parser = subparsers.add_parser("subscribe", help="Simulate subscription")
    subscribe_parser.add_argument(
        "--endpoint", "-e",
        help="Custom endpoint URL"
    )
    
    # Send command
    send_parser = subparsers.add_parser("send", help="Send test notification")
    send_parser.add_argument("--title", "-t", default="Test Notification")
    send_parser.add_argument("--body", "-b", default="This is a test notification")
    send_parser.add_argument("--category", "-c", default="system")
    
    # Stats command
    subparsers.add_parser("stats", help="Get notification statistics")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    print(f"API URL: {args.api_url}")
    print()
    
    if args.command == "test-endpoint":
        success = test_endpoint(args.api_url)
    elif args.command == "subscribe":
        success = subscribe_user(args.api_url, args.user, args.endpoint)
    elif args.command == "send":
        success = send_notification(
            args.api_url,
            args.user,
            args.title,
            args.body,
            args.category
        )
    elif args.command == "stats":
        success = get_stats(args.api_url)
    else:
        parser.print_help()
        sys.exit(1)
    
    print()
    if success:
        print("✓ Success")
        sys.exit(0)
    else:
        print("✗ Failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
