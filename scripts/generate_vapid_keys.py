#!/usr/bin/env python3
[Ver001.000]
"""
VAPID Key Generator
===================
Generate VAPID keys for Web Push Protocol authentication.

VAPID (Voluntary Application Server Identification) keys are used to
authenticate your application server to push services (FCM, Mozilla, etc.).

Usage:
    python scripts/generate_vapid_keys.py
    python scripts/generate_vapid_keys.py --output .env.local
    python scripts/generate_vapid_keys.py --email admin@yourdomain.com
"""

import os
import sys
import argparse
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from packages.shared.api.src.notifications.push_service import VAPIDKeyManager
except ImportError:
    # Fallback if structure is different
    try:
        import base64
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.backends import default_backend
        CRYPTO_AVAILABLE = True
    except ImportError:
        CRYPTO_AVAILABLE = False
        print("Error: cryptography library not installed.")
        print("Install with: pip install cryptography")
        sys.exit(1)


def generate_keys_manual() -> tuple:
    """Generate VAPID keys manually if import fails."""
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    public_key = private_key.public_key()
    
    # Serialize public key (uncompressed point format)
    public_key_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint
    )
    public_key_b64 = base64.urlsafe_b64encode(public_key_bytes).decode("ascii").rstrip("=")
    
    # Serialize private key
    private_key_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    private_key_b64 = base64.urlsafe_b64encode(private_key_bytes).decode("ascii").rstrip("=")
    
    return public_key_b64, private_key_b64


def main():
    parser = argparse.ArgumentParser(
        description="Generate VAPID keys for Web Push notifications"
    )
    parser.add_argument(
        "--output", "-o",
        default=".env",
        help="Output file path (default: .env)"
    )
    parser.add_argument(
        "--email", "-e",
        default="admin@example.com",
        help="Contact email for VAPID claims"
    )
    parser.add_argument(
        "--append", "-a",
        action="store_true",
        help="Append to existing file instead of overwriting"
    )
    parser.add_argument(
        "--dry-run", "-d",
        action="store_true",
        help="Print keys without writing to file"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("VAPID Key Generator for Web Push Protocol")
    print("=" * 60)
    print()
    
    # Generate keys
    try:
        if 'VAPIDKeyManager' in dir():
            vapid = VAPIDKeyManager()
            vapid.generate_keys()
            public_key = vapid.public_key
            # Get private key bytes for export
            private_key_bytes = vapid.private_key.private_bytes(
                encoding=serialization.Encoding.DER,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            private_key = base64.urlsafe_b64encode(private_key_bytes).decode("ascii").rstrip("=")
        else:
            public_key, private_key = generate_keys_manual()
    except Exception as e:
        print(f"Error generating keys: {e}")
        sys.exit(1)
    
    # Prepare output
    timestamp = datetime.utcnow().isoformat()
    output_content = f"""# VAPID Keys for Web Push Notifications
# Generated: {timestamp}
# 
# IMPORTANT: Keep the private key secret! Never commit it to version control.
# The public key can be shared with clients (browsers) for subscription.
#
# Web Push Protocol Documentation:
# https://tools.ietf.org/html/rfc8292

VAPID_PUBLIC_KEY={public_key}
VAPID_PRIVATE_KEY={private_key}
VAPID_CLAIMS_EMAIL={args.email}
"""
    
    # Display keys
    print("Generated VAPID Keys:")
    print("-" * 60)
    print(f"Public Key:  {public_key}")
    print()
    print(f"Private Key: {private_key[:20]}...{private_key[-20:]}")
    print(f"Email:       {args.email}")
    print("-" * 60)
    print()
    
    if args.dry_run:
        print("Dry run mode - keys not written to file.")
        print()
        print("Full .env content:")
        print(output_content)
        return
    
    # Write to file
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        mode = "a" if args.append else "w"
        with open(output_path, mode) as f:
            if args.append:
                f.write("\n\n")
            f.write(output_content)
        
        print(f"Keys written to: {output_path.absolute()}")
        print()
        
        if args.append:
            print("Keys appended to existing file.")
        else:
            print("WARNING: If this file exists, it has been overwritten.")
        
        print()
        print("Next steps:")
        print("1. Add VAPID_PUBLIC_KEY to your frontend environment")
        print("2. Ensure VAPID_PRIVATE_KEY is set in your backend environment")
        print("3. Update VAPID_CLAIMS_EMAIL to your actual contact email")
        print()
        print("Security reminder:")
        print("- NEVER commit the private key to version control")
        print("- Add .env files to .gitignore")
        print("- Use environment variables in production")
        
    except Exception as e:
        print(f"Error writing to file: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
