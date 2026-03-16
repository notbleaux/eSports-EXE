"""
[Ver002.000]
Database Query Optimization Script

Analyzes PostgreSQL database for slow queries and missing indexes.
Provides recommendations for query optimization.

Usage: python scripts/optimize_queries.py
"""

import asyncio
import asyncpg
import os
import sys
from typing import List, Dict, Any
from datetime import datetime

# Database connection from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/sator"
)


class QueryOptimizer:
    """Database query optimization analyzer."""
    
    def __init__(self, connection_url: str):
        self.connection_url = connection_url
        self.conn: asyncpg.Connection = None
        self.recommendations: List[Dict[str, Any]] = []
        
    async def connect(self):
        """Establish database connection."""
        try:
            self.conn = await asyncpg.connect(self.connection_url)
            print("✅ Connected to database\n")
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
            sys.exit(1)
            
    async def disconnect(self):
        """Close database connection."""
        if self.conn:
            await self.conn.close()
            
    async def check_pg_stat_statements(self) -> bool:
        """Check if pg_stat_statements extension is available."""
        try:
            result = await self.conn.fetchval(
                "SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'"
            )
            return result is not None
        except:
            return False
            
    async def analyze_slow_queries(self) -> List[Dict[str, Any]]:
        """Identify slow queries from pg_stat_statements."""
        print("🔍 Analyzing slow queries...")
        
        has_stats = await self.check_pg_stat_statements()
        if not has_stats:
            print("   ⚠️  pg_stat_statements extension not available")
            print("   Run: CREATE EXTENSION IF NOT EXISTS pg_stat_statements;\n")
            return []
            
        queries = await self.conn.fetch(
            """
            SELECT 
                query,
                calls,
                round(total_exec_time::numeric, 2) as total_time_ms,
                round(mean_exec_time::numeric, 2) as mean_time_ms,
                round(stddev_exec_time::numeric, 2) as stddev_time_ms,
                rows
            FROM pg_stat_statements
            WHERE query NOT LIKE '%pg_stat%'
              AND calls > 10
            ORDER BY mean_exec_time DESC
            LIMIT 10;
            """
        )
        
        slow_queries = []
        for row in queries:
            query_info = {
                "query": row["query"][:100] + "..." if len(row["query"]) > 100 else row["query"],
                "calls": row["calls"],
                "mean_time_ms": row["mean_time_ms"],
                "total_time_ms": row["total_time_ms"],
                "rows": row["rows"]
            }
            slow_queries.append(query_info)
            
            if row["mean_time_ms"] > 200:
                self.recommendations.append({
                    "type": "slow_query",
                    "severity": "high" if row["mean_time_ms"] > 500 else "medium",
                    "query": row["query"][:80] + "...",
                    "mean_time_ms": row["mean_time_ms"],
                    "suggestion": "Consider adding indexes or optimizing query structure"
                })
                
        return slow_queries
        
    async def check_missing_indexes(self) -> List[Dict[str, Any]]:
        """Check for potentially missing indexes."""
        print("🔍 Checking for missing indexes...")
        
        missing = await self.conn.fetch(
            """
            SELECT 
                schemaname,
                tablename,
                attname as column,
                n_tup_read,
                n_tup_fetch
            FROM pg_stats 
            WHERE schemaname = 'public'
              AND tablename IN ('matches', 'players', 'odds_history', 
                               'player_performance', 'teams', 'tournaments')
            ORDER BY n_tup_read DESC
            LIMIT 20;
            """
        )
        
        missing_indexes = []
        for row in missing:
            missing_indexes.append({
                "table": row["tablename"],
                "column": row["attname"],
                "reads": row["n_tup_read"]
            })
            
        return missing_indexes
        
    async def analyze_table_indexes(self) -> List[Dict[str, Any]]:
        """Analyze existing indexes on key tables."""
        print("🔍 Analyzing existing indexes...")
        
        indexes = await self.conn.fetch(
            """
            SELECT 
                schemaname,
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND tablename IN ('matches', 'players', 'odds_history', 
                               'player_performance', 'teams', 'tournaments')
            ORDER BY tablename, indexname;
            """
        )
        
        index_list = []
        for row in indexes:
            index_list.append({
                "table": row["tablename"],
                "index": row["indexname"],
                "definition": row["indexdef"][:80] + "..." if len(row["indexdef"]) > 80 else row["indexdef"]
            })
            
        return index_list
        
    async def check_table_sizes(self) -> List[Dict[str, Any]]:
        """Check table sizes for optimization opportunities."""
        print("🔍 Checking table sizes...")
        
        sizes = await self.conn.fetch(
            """
            SELECT 
                relname as table_name,
                pg_size_pretty(pg_total_relation_size(relid)) as total_size,
                pg_total_relation_size(relid) as size_bytes,
                n_live_tup as row_count
            FROM pg_stat_user_tables
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(relid) DESC
            LIMIT 10;
            """
        )
        
        table_sizes = []
        for row in sizes:
            table_sizes.append({
                "table": row["table_name"],
                "size": row["total_size"],
                "size_bytes": row["size_bytes"],
                "rows": row["row_count"]
            })
            
            # Flag large tables
            if row["size_bytes"] > 1024 * 1024 * 1024:  # > 1GB
                self.recommendations.append({
                    "type": "large_table",
                    "severity": "medium",
                    "table": row["table_name"],
                    "size": row["total_size"],
                    "suggestion": "Consider partitioning or archiving old data"
                })
                
        return table_sizes
        
    async def analyze_betting_queries(self):
        """Analyze specific betting/odds queries."""
        print("🔍 Analyzing betting queries...")
        
        # Check odds_history table
        odds_count = await self.conn.fetchval(
            "SELECT COUNT(*) FROM odds_history"
        )
        
        print(f"   odds_history rows: {odds_count:,}")
        
        if odds_count > 100000:
            self.recommendations.append({
                "type": "index_needed",
                "severity": "high",
                "table": "odds_history",
                "suggestion": "Add index on (match_id, timestamp) for odds history queries"
            })
            
    async def generate_recommendations(self):
        """Generate optimization recommendations."""
        print("\n💡 GENERATING RECOMMENDATIONS...")
        print("=" * 80)
        
        # Check for missing composite indexes
        key_tables = ["matches", "odds_history", "player_performance"]
        for table in key_tables:
            # Check if match_id index exists
            has_match_id_idx = await self.conn.fetchval(
                """
                SELECT 1 FROM pg_indexes 
                WHERE tablename = $1 
                  AND indexdef LIKE '%match_id%'
                LIMIT 1
                """,
                table
            )
            
            if not has_match_id_idx and table != "matches":
                self.recommendations.append({
                    "type": "index_needed",
                    "severity": "high",
                    "table": table,
                    "suggestion": f"CREATE INDEX idx_{table}_match_id ON {table}(match_id);"
                })
                
    def print_report(self, slow_queries, missing_indexes, existing_indexes, table_sizes):
        """Print optimization report."""
        print("\n" + "=" * 80)
        print("📊 DATABASE OPTIMIZATION REPORT")
        print("=" * 80)
        print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Slow queries
        print("\n⏱️  SLOWEST QUERIES (by mean execution time)")
        print("-" * 80)
        if slow_queries:
            for i, q in enumerate(slow_queries[:5], 1):
                print(f"{i}. Mean: {q['mean_time_ms']}ms | Calls: {q['calls']} | Rows: {q['rows']}")
                print(f"   Query: {q['query']}\n")
        else:
            print("   No slow query data available\n")
            
        # Table sizes
        print("\n📦 TABLE SIZES")
        print("-" * 80)
        print(f"{'Table'.padEnd(25)} {'Size'.padEnd(15)} {'Rows'.padEnd(15)}")
        print("-" * 80)
        for t in table_sizes:
            print(f"{t['table'].padEnd(25)} {t['size'].padEnd(15)} {str(t['rows']).padEnd(15)}")
            
        # Existing indexes
        print("\n🔍 EXISTING INDEXES")
        print("-" * 80)
        print(f"{'Table'.padEnd(20)} {'Index'.padEnd(30)} {'Definition'.padEnd(40)}")
        print("-" * 80)
        for idx in existing_indexes[:10]:
            print(f"{idx['table'].padEnd(20)} {idx['index'][:28].padEnd(30)} {idx['definition'][:38]}")
            
        # Recommendations
        print("\n⚡ RECOMMENDATIONS")
        print("-" * 80)
        if self.recommendations:
            high = [r for r in self.recommendations if r.get("severity") == "high"]
            medium = [r for r in self.recommendations if r.get("severity") == "medium"]
            
            if high:
                print("\n🔴 HIGH PRIORITY:")
                for r in high:
                    print(f"  • [{r['type']}] {r.get('suggestion', 'Review needed')}")
                    if 'query' in r:
                        print(f"    Query: {r['query']}")
                        
            if medium:
                print("\n🟡 MEDIUM PRIORITY:")
                for r in medium:
                    print(f"  • [{r['type']}] {r.get('suggestion', 'Review needed')}")
        else:
            print("   ✅ No critical issues found\n")
            
        print("\n" + "=" * 80)
        

async def main():
    """Main optimization routine."""
    print("\n🔧 Database Query Optimizer")
    print("=" * 80)
    
    optimizer = QueryOptimizer(DATABASE_URL)
    
    try:
        await optimizer.connect()
        
        # Run analyses
        slow_queries = await optimizer.analyze_slow_queries()
        missing_indexes = await optimizer.check_missing_indexes()
        existing_indexes = await optimizer.analyze_table_indexes()
        table_sizes = await optimizer.check_table_sizes()
        await optimizer.analyze_betting_queries()
        await optimizer.generate_recommendations()
        
        # Print report
        optimizer.print_report(slow_queries, missing_indexes, existing_indexes, table_sizes)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await optimizer.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
