"""
sign_off.py — Agent-ID-Protocol sign-off generator (Phase 1.6).

[Ver001.000] · companion to crypto_client.py

Reads the central polyrepo registry, auto-derives counter slots, and
emits either:
  - a git commit trailer block (default)
  - a PR-body YAML frontmatter block (--format=yaml)

Used to remove the friction of hand-crafting sign-off blocks every commit.

Usage examples:

  # Trailer block, auto-derive counters
  python3 services/agent-gateway/sign_off.py \\
      --agent-id agent_claude_code_local \\
      --plan-id PLN-003-network-api \\
      --session-id 01HXX-ZSPRT-0G0F5

  # PR body frontmatter
  python3 services/agent-gateway/sign_off.py \\
      --agent-id agent_claude_code_local \\
      --plan-id PLN-002-agent-id \\
      --session-id 01HXX-ZSPRT-0G0F5 \\
      --format yaml

  # Pipe into git commit
  git commit -F <(python3 services/agent-gateway/sign_off.py \\
                    --agent-id agent_claude_code_local \\
                    --plan-id PLN-XXX --session-id <id> \\
                    --subject "feat(scope): description")

Counter semantics (per .agents/AGENT_ID_PROTOCOL.md §3):
  - This tool READS current counter state from polyrepo/registry/index.json
  - It does NOT write back — the consuming commit / PR is expected to
    bump the registry in the same commit (manual today; automated in
    Phase 5 networked enforcement)
  - The order number printed is `current + 1` (the next unclaimed slot)
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, Optional

REGISTRY_PATH_DEFAULT = (
    Path(__file__).resolve().parents[2] / "polyrepo" / "registry" / "index.json"
)

# Recognized lineage codes (mirrors .agents/lineage-discovery.yaml)
LINEAGE_FROM_AGENT_ID = {
    "agent_claude_code_local": "claude",
    "agent_claude_code_cloud": "claude",
    "agent_copilot_swe_agent": "copilot",
    "agent_kimi_claw_worker": "kimi",
    "agent_kimi_cli_worker": "kimi",
    "agent_mimo_hermes_cloud": "mimo",
    "agent_hermes_host": "hermes",
    "agent_gpt_5": "gpt",
    "agent_gemini_3_pro": "gemini",
    "agent_qwen": "qwen",
}

LINEAGE_SHORT = {
    "claude": "CLA",
    "copilot": "COP",
    "kimi": "KMI",
    "mimo": "MMO",
    "hermes": "HRM",
    "gpt": "GPT",
    "gemini": "GEM",
    "qwen": "QWN",
}


def _load_registry(path: Path) -> dict:
    if not path.exists():
        sys.stderr.write(f"ERROR: registry not found at {path}\n")
        sys.exit(2)
    return json.loads(path.read_text())


def _resolve_lineage(agent_id: str) -> str:
    """Resolve a lineage from an agent_id. Strict — unknown ids fail loudly."""
    if agent_id in LINEAGE_FROM_AGENT_ID:
        return LINEAGE_FROM_AGENT_ID[agent_id]
    # Allow `agent_<lineage>_*` fallback for unfamiliar custom IDs
    m = re.match(r"^agent_(claude|copilot|kimi|mimo|hermes|gpt|gemini|qwen)(?:_|$)", agent_id)
    if m:
        return m.group(1)
    sys.stderr.write(
        f"ERROR: cannot resolve lineage for agent_id={agent_id!r}. "
        f"Either add it to LINEAGE_FROM_AGENT_ID in this script "
        f"or use a name matching `agent_<lineage>_*`.\n"
    )
    sys.exit(2)


def _derive_counters(
    registry: dict,
    agent_id: str,
    lineage: str,
    plan_id: str,
    repo_short: str = "ZSXT",
    project_short: str = "NJZ",
) -> Dict[str, int]:
    """Pull `next` from each scope (does NOT mutate the registry)."""
    repos = registry.get("repos", {})
    agents = registry.get("agents", {})
    projects = registry.get("projects", {})
    plans = registry.get("plans", {})
    portfolio = registry.get("portfolio", {})

    return {
        "repo": repos.get(repo_short, {}).get("next", 0),
        "agent": agents.get(lineage, {}).get("next", 0),
        "session_count": agents.get(lineage, {}).get("session_count", 0) or 0,
        "project": projects.get(repo_short, {}).get("next", 0),
        "plan": plans.get(plan_id, {}).get("next", 0),
        "portfolio": portfolio.get("next", 0),
    }


def _model_for_lineage(lineage: str, override: Optional[str]) -> str:
    """Best-effort model slug for the URI; override wins."""
    if override:
        return override
    # Reasonable defaults; agents can override via --model flag
    return {
        "claude": "claude-opus-4-7",
        "copilot": "copilot-swe-agent",
        "kimi": "k2-6",
        "mimo": "mimo-v2-5-pro",
        "hermes": "hermes-host",
        "gpt": "unknown",
        "gemini": "unknown",
        "qwen": "unknown",
    }.get(lineage, "unknown")


def _format_trailer(
    agent_id: str,
    lineage: str,
    model: str,
    session_id: str,
    counters: Dict[str, int],
    plan_id: str,
    repo_short: str,
    project_short: str,
) -> str:
    lineage_short = LINEAGE_SHORT.get(lineage, lineage.upper()[:3])
    order = counters["agent"]  # already the NEXT slot
    return (
        f"Agent-Sign-Off:     agent://{lineage}/{model}/{session_id}/A{order:04d}\n"
        f"{repo_short}-R-Counter:     {repo_short}-R-{counters['repo']:04d}\n"
        f"Agent-Counter:      {repo_short}-AGENT-{lineage_short}-S{counters['session_count']:02d}-A{order:04d}\n"
        f"Project-Counter:    {project_short}-P-{counters['project']:04d}\n"
        f"Plan-Counter:       {plan_id}-A{counters['plan']:04d}\n"
        f"Portfolio-Counter:  NJZPL-MUTUAL-{counters['portfolio']:04d}\n"
    )


def _format_yaml(
    agent_id: str,
    lineage: str,
    model: str,
    session_id: str,
    counters: Dict[str, int],
    plan_id: str,
) -> str:
    order = counters["agent"]
    return (
        "---\n"
        f"agent-sign-off: agent://{lineage}/{model}/{session_id}/A{order:04d}\n"
        f"plan-counter: {plan_id}-A{counters['plan']:04d}\n"
        f"portfolio-counter: NJZPL-MUTUAL-{counters['portfolio']:04d}\n"
        "---\n"
    )


def _cli() -> int:
    p = argparse.ArgumentParser(
        description=(
            "Emit an Agent-ID-Protocol sign-off block "
            "(git commit trailer or PR body YAML frontmatter)."
        ),
    )
    p.add_argument("--agent-id", required=True, help="e.g. agent_claude_code_local")
    p.add_argument("--plan-id", required=True, help="e.g. PLN-003-network-api")
    p.add_argument("--session-id", required=True, help="e.g. 01HXX-ZSPRT-0G0F5")
    p.add_argument("--model", help="Override model slug (else lineage default)")
    p.add_argument(
        "--format",
        choices=["trailer", "yaml"],
        default="trailer",
        help="Output format (default: trailer)",
    )
    p.add_argument(
        "--subject",
        help="If provided, prepend a commit subject + blank line for piping into `git commit -F -`",
    )
    p.add_argument(
        "--registry",
        type=Path,
        default=REGISTRY_PATH_DEFAULT,
        help=f"Path to central registry JSON (default: {REGISTRY_PATH_DEFAULT})",
    )
    p.add_argument("--repo-short", default="ZSXT", help="Repo short code (default: ZSXT)")
    p.add_argument("--project-short", default="NJZ", help="Project short code (default: NJZ)")
    args = p.parse_args()

    registry = _load_registry(args.registry)
    lineage = _resolve_lineage(args.agent_id)
    model = _model_for_lineage(lineage, args.model)
    counters = _derive_counters(
        registry, args.agent_id, lineage, args.plan_id, args.repo_short, args.project_short
    )

    if args.format == "yaml":
        out = _format_yaml(args.agent_id, lineage, model, args.session_id, counters, args.plan_id)
    else:
        out = _format_trailer(
            args.agent_id, lineage, model, args.session_id, counters, args.plan_id,
            args.repo_short, args.project_short
        )

    if args.subject:
        sys.stdout.write(f"{args.subject}\n\n")
    sys.stdout.write(out)
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(_cli())
