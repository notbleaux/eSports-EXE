"""
Queue Management CLI for the dual-game extraction pipeline.

Provides command-line interface for managing jobs, agents, and queue operations.
Usage:
    python queue_cli.py --db-url postgresql://... status
    python queue_cli.py --db-url postgresql://... queue list --game cs
    python queue_cli.py --db-url postgresql://... agent list
    python queue_cli.py --db-url postgresql://... job retry --id <job-id>
"""
import asyncio
import argparse
from datetime import datetime, timedelta
from typing import Optional, List
import asyncpg
from tabulate import tabulate
import json


class QueueCLI:
    """Command-line interface for queue management."""
    
    def __init__(self, db_pool: asyncpg.Pool):
        self.db_pool = db_pool
        
    async def get_status(self) -> dict:
        """Get overall pipeline status."""
        async with self.db_pool.acquire() as conn:
            # Queue overview
            queues = await conn.fetch("""
                SELECT 
                    game,
                    COUNT(*) FILTER (WHERE status = 'pending') as pending,
                    COUNT(*) FILTER (WHERE status = 'processing') as processing,
                    COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '24 hours') as completed_24h,
                    COUNT(*) FILTER (WHERE status = 'failed' AND completed_at > NOW() - INTERVAL '24 hours') as failed_24h
                FROM extraction_jobs
                GROUP BY game
                ORDER BY game
            """)
            
            # Agent status
            agents = await conn.fetch("""
                SELECT 
                    status,
                    COUNT(*) as count
                FROM extraction_agents
                WHERE last_heartbeat > NOW() - INTERVAL '5 minutes'
                GROUP BY status
            """)
            
            # Recent errors
            recent_errors = await conn.fetch("""
                SELECT 
                    game,
                    source,
                    job_type,
                    error_message,
                    completed_at
                FROM extraction_jobs
                WHERE status = 'failed'
                AND completed_at > NOW() - INTERVAL '1 hour'
                ORDER BY completed_at DESC
                LIMIT 5
            """)
            
            return {
                'queues': [dict(q) for q in queues],
                'agents': {a['status']: a['count'] for a in agents},
                'recent_errors': [dict(e) for e in recent_errors]
            }
    
    async def list_queue(
        self, 
        game: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """List jobs in queue."""
        async with self.db_pool.acquire() as conn:
            query = """
                SELECT 
                    id,
                    game,
                    source,
                    job_type,
                    priority,
                    status,
                    assigned_agent,
                    created_at,
                    started_at,
                    retry_count
                FROM extraction_jobs
                WHERE 1=1
            """
            params = []
            
            if game:
                params.append(game)
                query += f" AND game = ${len(params)}"
            
            if status:
                params.append(status)
                query += f" AND status = ${len(params)}"
            else:
                query += " AND status IN ('pending', 'processing', 'assigned')"
            
            params.append(limit)
            query += f" ORDER BY priority DESC, created_at ASC LIMIT ${len(params)}"
            
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    async def list_agents(self) -> List[dict]:
        """List all agents."""
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT 
                    id,
                    status,
                    current_job_id,
                    game_specialization,
                    source_capabilities,
                    last_heartbeat,
                    total_jobs_completed,
                    total_jobs_failed,
                    CASE 
                        WHEN last_heartbeat < NOW() - INTERVAL '5 minutes' THEN 'STALE'
                        ELSE 'OK'
                    END as health
                FROM extraction_agents
                ORDER BY status, id
            """)
            return [dict(row) for row in rows]
    
    async def retry_job(self, job_id: str) -> bool:
        """Retry a failed job."""
        async with self.db_pool.acquire() as conn:
            result = await conn.execute("""
                UPDATE extraction_jobs
                SET 
                    status = 'pending',
                    retry_count = retry_count + 1,
                    assigned_agent = NULL,
                    started_at = NULL,
                    completed_at = NULL,
                    error_message = NULL
                WHERE id = $1
                AND status = 'failed'
            """, job_id)
            
            return 'UPDATE 1' in result
    
    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a pending job."""
        async with self.db_pool.acquire() as conn:
            result = await conn.execute("""
                UPDATE extraction_jobs
                SET status = 'cancelled'
                WHERE id = $1
                AND status IN ('pending', 'assigned')
            """, job_id)
            
            return 'UPDATE 1' in result
    
    async def prioritize_job(self, job_id: str, priority: int) -> bool:
        """Change job priority."""
        async with self.db_pool.acquire() as conn:
            result = await conn.execute("""
                UPDATE extraction_jobs
                SET priority = $2
                WHERE id = $1
            """, job_id, priority)
            
            return 'UPDATE 1' in result
    
    async def purge_completed(self, days: int = 7) -> int:
        """Purge old completed jobs."""
        async with self.db_pool.acquire() as conn:
            count = await conn.fetchval("""
                DELETE FROM extraction_jobs
                WHERE status = 'completed'
                AND completed_at < NOW() - INTERVAL '$1 days'
                RETURNING COUNT(*)
            """, days)
            
            return count or 0
    
    async def get_job_details(self, job_id: str) -> Optional[dict]:
        """Get detailed job information."""
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT 
                    j.*,
                    EXTRACT(EPOCH FROM (j.completed_at - j.started_at)) as duration_seconds
                FROM extraction_jobs j
                WHERE j.id = $1
            """, job_id)
            
            return dict(row) if row else None
    
    async def bulk_retry(self, game: Optional[str] = None, hours: int = 24) -> int:
        """Retry all failed jobs."""
        async with self.db_pool.acquire() as conn:
            query = """
                UPDATE extraction_jobs
                SET 
                    status = 'pending',
                    retry_count = retry_count + 1,
                    assigned_agent = NULL,
                    started_at = NULL,
                    completed_at = NULL,
                    error_message = NULL
                WHERE status = 'failed'
                AND completed_at > NOW() - INTERVAL '$1 hours'
            """
            params = [hours]
            
            if game:
                query += " AND game = $2"
                params.append(game)
            
            result = await conn.execute(query, *params)
            
            # Extract number from "UPDATE N"
            import re
            match = re.search(r'UPDATE (\d+)', result)
            return int(match.group(1)) if match else 0


def format_table(data: List[dict], columns: Optional[List[str]] = None) -> str:
    """Format data as ASCII table."""
    if not data:
        return "No data found."
    
    if columns:
        data = [{k: v for k, v in row.items() if k in columns} for row in data]
    
    return tabulate(data, headers='keys', tablefmt='grid')


async def main():
    parser = argparse.ArgumentParser(
        description='Queue Management CLI for Axiom Pipeline'
    )
    parser.add_argument(
        '--db-url', 
        required=True, 
        help='PostgreSQL connection URL'
    )
    parser.add_argument(
        '--format',
        choices=['table', 'json'],
        default='table',
        help='Output format'
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Status command
    subparsers.add_parser('status', help='Show pipeline status')
    
    # Queue command
    queue_parser = subparsers.add_parser('queue', help='Queue operations')
    queue_subparsers = queue_parser.add_subparsers(dest='queue_action')
    
    list_parser = queue_subparsers.add_parser('list', help='List jobs')
    list_parser.add_argument('--game', choices=['cs', 'valorant'], help='Filter by game')
    list_parser.add_argument('--status', choices=['pending', 'processing', 'assigned', 'failed'], help='Filter by status')
    list_parser.add_argument('--limit', type=int, default=50, help='Limit results')
    
    # Job command
    job_parser = subparsers.add_parser('job', help='Job operations')
    job_subparsers = job_parser.add_subparsers(dest='job_action')
    
    retry_parser = job_subparsers.add_parser('retry', help='Retry a failed job')
    retry_parser.add_argument('--id', required=True, help='Job ID')
    
    cancel_parser = job_subparsers.add_parser('cancel', help='Cancel a pending job')
    cancel_parser.add_argument('--id', required=True, help='Job ID')
    
    priority_parser = job_subparsers.add_parser('priority', help='Change job priority')
    priority_parser.add_argument('--id', required=True, help='Job ID')
    priority_parser.add_argument('--level', type=int, required=True, help='Priority level (1-10)')
    
    details_parser = job_subparsers.add_parser('details', help='Show job details')
    details_parser.add_argument('--id', required=True, help='Job ID')
    
    # Agent command
    agent_parser = subparsers.add_parser('agent', help='Agent operations')
    agent_subparsers = agent_parser.add_subparsers(dest='agent_action')
    agent_subparsers.add_parser('list', help='List all agents')
    
    # Bulk command
    bulk_parser = subparsers.add_parser('bulk', help='Bulk operations')
    bulk_subparsers = bulk_parser.add_subparsers(dest='bulk_action')
    
    retry_all_parser = bulk_subparsers.add_parser('retry-failed', help='Retry all failed jobs')
    retry_all_parser.add_argument('--game', choices=['cs', 'valorant'], help='Filter by game')
    retry_all_parser.add_argument('--hours', type=int, default=24, help='Only retry jobs failed within last N hours')
    
    purge_parser = bulk_subparsers.add_parser('purge', help='Purge old completed jobs')
    purge_parser.add_argument('--days', type=int, default=7, help='Purge jobs older than N days')
    
    args = parser.parse_args()
    
    # Connect to database
    db_pool = await asyncpg.create_pool(args.db_url)
    cli = QueueCLI(db_pool)
    
    try:
        if args.command == 'status':
            data = await cli.get_status()
            
            if args.format == 'json':
                print(json.dumps(data, indent=2, default=str))
            else:
                print("\n📊 PIPELINE STATUS\n")
                
                # Queues
                print("Queues:")
                print(format_table(data['queues']))
                
                # Agents
                print("\nAgents:")
                for status, count in data['agents'].items():
                    print(f"  {status}: {count}")
                
                # Recent errors
                if data['recent_errors']:
                    print("\n⚠️  Recent Errors (last hour):")
                    print(format_table(data['recent_errors']))
        
        elif args.command == 'queue':
            if args.queue_action == 'list':
                jobs = await cli.list_queue(
                    game=args.game,
                    status=args.status,
                    limit=args.limit
                )
                
                if args.format == 'json':
                    print(json.dumps(jobs, indent=2, default=str))
                else:
                    print(f"\n📋 JOBS ({len(jobs)} found)\n")
                    print(format_table(jobs))
        
        elif args.command == 'job':
            if args.job_action == 'retry':
                success = await cli.retry_job(args.id)
                print(f"Job {args.id} {'retried' if success else 'not found or not failed'}")
            
            elif args.job_action == 'cancel':
                success = await cli.cancel_job(args.id)
                print(f"Job {args.id} {'cancelled' if success else 'not found or not pending'}")
            
            elif args.job_action == 'priority':
                success = await cli.prioritize_job(args.id, args.level)
                print(f"Job {args.id} priority {'updated' if success else 'not changed'}")
            
            elif args.job_action == 'details':
                details = await cli.get_job_details(args.id)
                if details:
                    print(json.dumps(details, indent=2, default=str))
                else:
                    print(f"Job {args.id} not found")
        
        elif args.command == 'agent':
            if args.agent_action == 'list':
                agents = await cli.list_agents()
                
                if args.format == 'json':
                    print(json.dumps(agents, indent=2, default=str))
                else:
                    print(f"\n🤖 AGENTS ({len(agents)} found)\n")
                    print(format_table(agents))
        
        elif args.command == 'bulk':
            if args.bulk_action == 'retry-failed':
                count = await cli.bulk_retry(args.game, args.hours)
                print(f"Retried {count} failed jobs")
            
            elif args.bulk_action == 'purge':
                count = await cli.purge_completed(args.days)
                print(f"Purged {count} completed jobs")
        
        else:
            parser.print_help()
    
    finally:
        await db_pool.close()


if __name__ == '__main__':
    asyncio.run(main())
