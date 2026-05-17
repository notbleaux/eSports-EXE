[Ver001.000]

# Runbook: Agent ECDSA Keypair Generation + Public Hex Registration

**Audience:** Each lineage owner (Copilot SWE Agent, Kimi K2.6, MiMo, Hermes, GPT, Gemini, Qwen, future lineages)
**Reading time:** ~3 minutes
**Time to complete:** ~5 minutes per agent_id
**Protocol reference:** `.agents/AGENT_ID_PROTOCOL.md`

---

## Why this exists

The Agent ID Protocol uses ECDSA secp256k1 keypairs to attest agent actions (Phase 3+ enforcement). Each lineage is **sovereign over its own private key** — there is no central key-issuing authority. To participate in the network, each agent owner:

1. Generates a local keypair via `services/agent-gateway/crypto_client.py`
2. Keeps the private key **secret and local** (`services/agent-gateway/keys/` is gitignored)
3. Submits the public hex to `polyrepo/registry/index.json::public_keys` via a small PR

This runbook walks through that flow. `agent_claude_code_local` is already registered (PR #48); the other 7+ lineages are awaiting their owners.

---

## Step 1 — Prerequisites

```bash
# Python 3.10+ recommended; 3.8+ supported
python3 --version

# One runtime dep (the only one)
pip install ecdsa

# Confirm the registry exists in main
git pull origin main
ls polyrepo/registry/index.json
```

## Step 2 — Choose your `agent_id`

The canonical agent_id format is `agent_<lineage>_<role>_<environment>` (lowercase, snake_case). Pick one per host/role; **don't share a private key across hosts**.

| Lineage | Suggested agent_id | Slot in registry |
|---|---|---|
| Claude (local Code session) | `agent_claude_code_local` | ✅ already registered |
| Claude (cloud session) | `agent_claude_code_cloud` | open |
| GitHub Copilot | `agent_copilot_swe_agent` | open |
| Kimi (CLI worker) | `agent_kimi_cli_worker` | open |
| Kimi (background worker) | `agent_kimi_claw_worker` | open |
| MiMo (Hermes cloud node) | `agent_mimo_hermes_cloud` | open |
| Hermes host daemon | `agent_hermes_host` | open |
| GPT (OpenAI) | `agent_gpt_5` | open |
| Gemini | `agent_gemini_3_pro` | open |
| Qwen | `agent_qwen` | open |

New lineages: add to `.agents/lineage-discovery.yaml` first, then follow Step 3.

## Step 3 — Generate your keypair

```bash
python3 services/agent-gateway/crypto_client.py --agent-id <your_agent_id>
```

Example output:

```
[crypto_client] NEW keypair generated for agent_kimi_claw_worker.
  Public key (uncompressed hex — register in polyrepo/registry/index.json):
    04abcdef0123...   (130 hex chars total, leading "04")
Agent ID:       agent_kimi_claw_worker
Key path:       /home/user/ZeSporteXte/services/agent-gateway/keys/agent_kimi_claw_worker_private.pem
Public key hex: 04abcdef0123...
Roundtrip sig:  ok
```

**Verify:**
- Private key written to `services/agent-gateway/keys/<your_agent_id>_private.pem` with 0o600 perms
- `git status` shows **no new tracked files** (the `keys/` dir is gitignored)
- Roundtrip sig → `ok`

**Critical:**
- The private PEM file is your only signing credential. Back it up to a secrets manager (Bitwarden, 1Password, Vault, etc.) or a per-host encrypted store.
- Never commit `*_private.pem`. The gitignore rule lives at `.gitignore` line ~100 (`services/agent-gateway/keys/`).

## Step 4 — Open a PR registering your public hex

Create a branch:

```bash
git checkout -b <lineage>/register-public-key-<your_agent_id>
```

Edit `polyrepo/registry/index.json` — find the `public_keys` block and replace the `null` for your agent_id with your hex string:

```jsonc
"public_keys": {
  "agent_claude_code_local": "049819d65b...abc5c",       // already set
  "agent_copilot_swe_agent": "04...your-public-hex...",  // ← your edit
  "agent_kimi_claw_worker": null,
  ...
}
```

Also bump your lineage's `next` counter and the portfolio mutual counter:

```jsonc
"agents": {
  ...
  "kimi": {
    "lineage_short": "KMI",
    "next": 1,           // ← bumped from 0
    "session_count": 1,  // ← bumped from 0 (you have a session now)
    "scope": "AGENT-KMI"
  }
},
...
"portfolio": {
  "next": <previous + 1>,   // ← bump
  ...
}
```

**Verify** before committing:

```bash
python3 -c "
import json
r = json.load(open('polyrepo/registry/index.json'))
pk = r['public_keys']['<your_agent_id>']
assert pk and pk.startswith('04') and len(pk) == 130, f'bad hex: {pk}'
print('ok — public key registered')
"
```

## Step 5 — Sign your own commit

This is the first commit signed under your new identity. Use the `sign_off.py` helper:

```bash
python3 services/agent-gateway/sign_off.py \
    --agent-id <your_agent_id> \
    --plan-id PLN-002-agent-id \
    --session-id <your-session-uuid-or-YYYYMMDD-N>
```

This emits a trailer block. Pipe into `git commit -F` or paste into the commit message body.

For the PR description, generate the YAML frontmatter form:

```bash
python3 services/agent-gateway/sign_off.py \
    --agent-id <your_agent_id> \
    --plan-id PLN-002-agent-id \
    --session-id <your-session-uuid-or-YYYYMMDD-N> \
    --format yaml
```

Paste the `---` block at the top of your PR description.

## Step 6 — Push and open PR

```bash
git push -u origin <lineage>/register-public-key-<your_agent_id>
gh pr create --title "feat(agents): register public key for <your_agent_id>" \
             --body "<paste YAML frontmatter + brief context>"
```

Your PR will:
- Trigger the **Phase 1 soft enforcement workflow** (`.github/workflows/agent-id-check.yml`) — checks for sign-off presence; should pass since you included it
- Be reviewed by the repo owner
- Once merged, your public hex is registered and your identity is live on the network

---

## Key rotation (when needed)

If a private key is compromised or end-of-lifed:

1. Generate a new keypair at `<your_agent_id>_v2` (e.g. `agent_kimi_claw_worker_v2`)
2. Register the new public hex (new slot in `public_keys`)
3. Mark the old slot's value as `"revoked:<oldhex>"` (string with prefix) so verifiers reject anything signed by it
4. Open ADR documenting rotation reason + timestamp

Future phases (4+) will support automatic key rotation via the network gateway; for now this is manual.

---

## Verification checklist

After your registration PR merges, confirm:

- [ ] `polyrepo/registry/index.json::public_keys.<your_agent_id>` is your 130-char hex
- [ ] `agents.<lineage>.next` ≥ 1 (you have at least one signed action)
- [ ] `portfolio.next` ≥ previous + 1
- [ ] You can verify your own roundtrip: `python3 services/agent-gateway/crypto_client.py --agent-id <your_agent_id>` → `Roundtrip sig: ok`
- [ ] Future commits carry your sign-off (manually or via `sign_off.py`)

## References

- `.agents/AGENT_ID_PROTOCOL.md` — schema, sign-off mechanism, enforcement roadmap
- `services/agent-gateway/crypto_client.py` — keypair gen / sign
- `services/agent-gateway/sign_off.py` — trailer + frontmatter helper
- `polyrepo/registry/index.json` — central registry (interim home in this repo)
- PR #48 — worked example for `agent_claude_code_local`
