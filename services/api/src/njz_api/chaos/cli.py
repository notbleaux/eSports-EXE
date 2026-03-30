"""[Ver001.000]
Chaos Engineering CLI

Command-line interface for running chaos experiments.

Usage:
    # Start a latency experiment
    python -m njz_api.chaos.cli latency --targets /v1/tournaments --duration 300
    
    # Run a predefined scenario
    python -m njz_api.chaos.cli scenario api_degradation --duration 600
    
    # Stop all experiments
    python -m njz_api.chaos.cli stop-all
    
    # View dashboard
    python -m njz_api.chaos.cli dashboard
"""

import argparse
import asyncio
import json
import sys
from typing import List, Optional

from . import ChaosConfig, ChaosMode, chaos_engine
from .reporting import chaos_reporter


async def start_experiment(
    name: str,
    mode: str,
    probability: float,
    duration: int,
    intensity: float,
    targets: List[str],
) -> None:
    """Start a chaos experiment."""
    config = ChaosConfig(
        mode=ChaosMode(mode),
        probability=probability,
        duration=duration,
        intensity=intensity,
        targets=targets,
    )
    
    experiment = await chaos_engine.start_experiment(name, config)
    print(f"🌩️  Started experiment: {name}")
    print(f"   Mode: {mode}")
    print(f"   Probability: {probability}")
    print(f"   Duration: {duration}s")
    print(f"   Targets: {targets}")
    
    # Start reporting
    chaos_reporter.start_experiment(name, mode)


async def stop_experiment(name: str) -> None:
    """Stop a chaos experiment."""
    success = await chaos_engine.stop_experiment(name)
    if success:
        print(f"🛑 Stopped experiment: {name}")
        chaos_reporter.end_experiment(name)
    else:
        print(f"❌ Experiment not found: {name}")
        sys.exit(1)


async def stop_all_experiments() -> None:
    """Stop all chaos experiments."""
    count = await chaos_engine.stop_all_experiments()
    print(f"🛑 Stopped {count} experiments")


async def list_experiments() -> None:
    """List active chaos experiments."""
    summary = chaos_engine.get_experiments_summary()
    
    print(f"Active Experiments: {summary['active_count']}\n")
    
    for exp in summary["experiments"]:
        print(f"  📊 {exp['name']}")
        print(f"     Mode: {exp['mode']}")
        print(f"     Probability: {exp['probability']}")
        print(f"     Intensity: {exp['intensity']}")
        print(f"     Targets: {exp['targets']}")
        print(f"     Active: {exp['is_active']}")
        print(f"     Requests Affected: {exp['metrics']['requests_affected']}")
        print()


async def show_dashboard() -> None:
    """Show chaos dashboard."""
    summary = chaos_engine.get_experiments_summary()
    recommendations = chaos_engine.get_recommendations()
    
    print("=" * 60)
    print("🌩️  CHAOS ENGINEERING DASHBOARD")
    print("=" * 60)
    print()
    
    print(f"Active Experiments: {summary['active_count']}")
    print()
    
    if summary["experiments"]:
        print("Running Experiments:")
        for exp in summary["experiments"]:
            print(f"  • {exp['name']} ({exp['mode']}) - {exp['metrics']['requests_affected']} requests affected")
    print()
    
    print("System Effects:")
    effects = summary["system_effects"]
    print(f"  DB Slow Enabled: {effects['db_slow_enabled']}")
    print(f"  DB Slow Delay: {effects['db_slow_delay_ms']:.0f}ms")
    print(f"  Cache Miss Enabled: {effects['cache_miss_enabled']}")
    print(f"  Redis Fail Enabled: {effects['redis_fail_enabled']}")
    print()
    
    if recommendations:
        print("Recommendations:")
        for rec in recommendations:
            icon = "⚠️" if rec["type"] == "warning" else "ℹ️" if rec["type"] == "info" else "🚨"
            print(f"  {icon} {rec['message']}")


async def generate_report() -> None:
    """Generate chaos report."""
    html_path = chaos_reporter.generate_html_report()
    json_path = chaos_reporter.generate_json_report()
    
    print(f"📊 Reports generated:")
    print(f"   HTML: {html_path}")
    print(f"   JSON: {json_path}")


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Chaos Engineering CLI for NJZiteGeisTe Platform",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s latency -t /v1/tournaments -d 300 -p 0.3
  %(prog)s scenario api_degradation --duration 600
  %(prog)s stop my_experiment
  %(prog)s list
  %(prog)s dashboard
        """,
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Start experiment command
    start_parser = subparsers.add_parser("start", help="Start a chaos experiment")
    start_parser.add_argument("name", help="Experiment name")
    start_parser.add_argument("--mode", "-m", required=True, choices=[m.value for m in ChaosMode],
                            help="Chaos mode")
    start_parser.add_argument("--probability", "-p", type=float, default=0.1,
                            help="Injection probability (0.0-1.0)")
    start_parser.add_argument("--duration", "-d", type=int, default=60,
                            help="Duration in seconds")
    start_parser.add_argument("--intensity", "-i", type=float, default=1.0,
                            help="Intensity multiplier (0.0-10.0)")
    start_parser.add_argument("--targets", "-t", nargs="+", default=["*"],
                            help="Target endpoints")
    
    # Convenience commands for common modes
    latency_parser = subparsers.add_parser("latency", help="Quick latency experiment")
    latency_parser.add_argument("--duration", "-d", type=int, default=60)
    latency_parser.add_argument("--probability", "-p", type=float, default=0.3)
    latency_parser.add_argument("--intensity", "-i", type=float, default=1.0)
    latency_parser.add_argument("--targets", "-t", nargs="+", default=["/v1/*"])
    
    error_parser = subparsers.add_parser("errors", help="Quick error injection")
    error_parser.add_argument("--duration", "-d", type=int, default=60)
    error_parser.add_argument("--probability", "-p", type=float, default=0.1)
    error_parser.add_argument("--targets", "-t", nargs="+", default=["/v1/*"])
    
    # Scenario command
    scenario_parser = subparsers.add_parser("scenario", help="Run predefined scenario")
    scenario_parser.add_argument("name", choices=[
        "api_degradation",
        "database_crisis",
        "cache_failure",
        "resource_exhaustion",
        "network_chaos",
        "full_system_failure",
    ], help="Scenario name")
    scenario_parser.add_argument("--duration", "-d", type=int, default=300)
    scenario_parser.add_argument("--intensity", "-i", type=float, default=1.0)
    
    # Stop commands
    stop_parser = subparsers.add_parser("stop", help="Stop an experiment")
    stop_parser.add_argument("name", help="Experiment name")
    
    subparsers.add_parser("stop-all", help="Stop all experiments")
    
    # List command
    subparsers.add_parser("list", help="List active experiments")
    
    # Dashboard command
    subparsers.add_parser("dashboard", help="Show chaos dashboard")
    
    # Report command
    subparsers.add_parser("report", help="Generate chaos report")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Run the appropriate command
    if args.command == "start":
        asyncio.run(start_experiment(
            args.name,
            args.mode,
            args.probability,
            args.duration,
            args.intensity,
            args.targets,
        ))
    elif args.command == "latency":
        name = f"latency_{asyncio.get_event_loop().time():.0f}"
        asyncio.run(start_experiment(
            name,
            "latency",
            args.probability,
            args.duration,
            args.intensity,
            args.targets,
        ))
    elif args.command == "errors":
        name = f"errors_{asyncio.get_event_loop().time():.0f}"
        asyncio.run(start_experiment(
            name,
            "error",
            args.probability,
            args.duration,
            1.0,
            args.targets,
        ))
    elif args.command == "stop":
        asyncio.run(stop_experiment(args.name))
    elif args.command == "stop-all":
        asyncio.run(stop_all_experiments())
    elif args.command == "list":
        asyncio.run(list_experiments())
    elif args.command == "dashboard":
        asyncio.run(show_dashboard())
    elif args.command == "report":
        asyncio.run(generate_report())


if __name__ == "__main__":
    main()
