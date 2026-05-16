"""
crypto_client.py — ECDSA secp256k1 signing client for the agent network.

[Ver001.000] · Phase 1 of PLN-003-network-api

Provides:
- SecureAgentClient: keypair management (generate / load from PEM)
- generate_auth_headers(): produces (X-Agent-ID, X-Signature, X-Timestamp)
  triples for use with the future network API gateway (Phase 2+)

No network calls in Phase 1. This module is a pure cryptography reference
implementation imported by later phases.

Adapted from the reference implementation in plan v002
(/root/.claude/plans/plan-and-draft-the-elegant-widget.md, "Cryptographic
Reference Client" section).

Usage (standalone for keygen + sanity check):

    python services/agent-gateway/crypto_client.py \\
        --agent-id agent_claude_code_local \\
        --keys-dir services/agent-gateway/keys

Programmatic usage:

    from crypto_client import SecureAgentClient
    client = SecureAgentClient(
        agent_id="agent_claude_code_local",
        keys_dir="services/agent-gateway/keys",
    )
    headers = client.generate_auth_headers()
    # → {X-Agent-ID: ..., X-Signature: ..., X-Timestamp: ..., Content-Type: ...}
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path
from typing import Dict

try:
    from ecdsa import SigningKey, VerifyingKey, SECP256k1, BadSignatureError
    from ecdsa.util import sigdecode_der, sigencode_der
except ImportError:  # pragma: no cover — surfaced at boot, not at import
    sys.stderr.write(
        "ERROR: 'ecdsa' library not installed. Install with:\n"
        "    pip install ecdsa\n"
    )
    raise

DEFAULT_KEYS_DIR = Path(__file__).resolve().parent / "keys"
REPLAY_WINDOW_SECONDS = 60


class SecureAgentClient:
    """Per-agent ECDSA secp256k1 keypair + auth header generator.

    Idempotent on retry: if the keypair file exists, it's loaded; otherwise
    a new one is generated and persisted.
    """

    def __init__(
        self,
        agent_id: str,
        keys_dir: Path | str = DEFAULT_KEYS_DIR,
    ) -> None:
        if not agent_id or "/" in agent_id or ".." in agent_id:
            raise ValueError(
                f"agent_id must be non-empty and a safe filesystem token: {agent_id!r}"
            )
        self.agent_id = agent_id
        self.keys_dir = Path(keys_dir)
        self.keys_dir.mkdir(parents=True, exist_ok=True)
        self.private_key_path = self.keys_dir / f"{agent_id}_private.pem"
        self.signing_key = self._load_or_generate_key()
        self.verifying_key: VerifyingKey = self.signing_key.verifying_key

    def _load_or_generate_key(self) -> SigningKey:
        if self.private_key_path.exists():
            with self.private_key_path.open("rb") as f:
                return SigningKey.from_pem(f.read())
        sk = SigningKey.generate(curve=SECP256k1)
        with self.private_key_path.open("wb") as f:
            f.write(sk.to_pem())
        # Lock file perms — keys are not world-readable
        os.chmod(self.private_key_path, 0o600)
        pub_hex = sk.verifying_key.to_string("uncompressed").hex()
        print(
            f"[crypto_client] NEW keypair generated for {self.agent_id}.\n"
            f"  Public key (uncompressed hex — register in polyrepo/registry/index.json):\n"
            f"    {pub_hex}",
            file=sys.stderr,
        )
        return sk

    def public_key_hex(self) -> str:
        """Uncompressed public key hex — the form registered in the central registry."""
        return self.verifying_key.to_string("uncompressed").hex()

    def generate_auth_headers(self, now: float | None = None) -> Dict[str, str]:
        """Generate signed auth headers for a network API request.

        The signed message is `f"{agent_id}:{timestamp}"`, matching the
        verification logic the future gateway will use (Phase 2+).
        """
        timestamp = str(now if now is not None else time.time())
        message = f"{self.agent_id}:{timestamp}".encode("utf-8")
        signature = self.signing_key.sign_deterministic(
            message, sigencode=sigencode_der
        ).hex()
        return {
            "X-Agent-ID": self.agent_id,
            "X-Signature": signature,
            "X-Timestamp": timestamp,
            "Content-Type": "application/json",
        }

    def verify_roundtrip(self) -> bool:
        """Sanity check: sign + verify the agent's own message returns True."""
        headers = self.generate_auth_headers()
        message = f"{headers['X-Agent-ID']}:{headers['X-Timestamp']}".encode("utf-8")
        try:
            self.verifying_key.verify(
                bytes.fromhex(headers["X-Signature"]),
                message,
                sigdecode=sigdecode_der,
            )
            return True
        except BadSignatureError:
            return False


def _cli() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "ECDSA secp256k1 keypair manager + sanity check for the "
            "agent network gateway (Phase 1)."
        ),
    )
    parser.add_argument(
        "--agent-id",
        required=True,
        help="Canonical agent ID, e.g. agent_claude_code_local",
    )
    parser.add_argument(
        "--keys-dir",
        default=str(DEFAULT_KEYS_DIR),
        help=f"Directory where private key PEMs live (default: {DEFAULT_KEYS_DIR})",
    )
    args = parser.parse_args()

    client = SecureAgentClient(agent_id=args.agent_id, keys_dir=args.keys_dir)
    print(f"Agent ID:       {client.agent_id}")
    print(f"Key path:       {client.private_key_path}")
    print(f"Public key hex: {client.public_key_hex()}")

    ok = client.verify_roundtrip()
    print(f"Roundtrip sig:  {'ok' if ok else 'FAIL'}")
    return 0 if ok else 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(_cli())
