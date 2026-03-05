#!/usr/bin/env python3
"""
RAWS-BASE Parity Checker
SATOR-eXe-ROTAS Data Integrity System

This script ensures the twin-table architecture maintains synchronization
between RAWS (Reference Analytics Web Stats) and BASE (Basic Analytics Stats Engine).

Philosophy:
- RAWS is immutable source-of-truth data
- BASE is derived analytics that should always reference valid RAWS records
- Any divergence represents a data integrity issue that must be resolved
"""

import sqlite3
import hashlib
import json
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import argparse
import sys


@dataclass
class ParityReport:
    """Report entry for a single table pair"""
    table_pair: str
    raws_count: int
    base_count: int
    matched: int
    orphaned_base: int  # BASE records without RAWS
    missing_base: int   # RAWS records without BASE
    hash_mismatches: int
    sync_errors: int
    status: str  # 'ok', 'warning', 'error'
    details: List[str]


@dataclass
class SyncCheck:
    """Individual record sync check result"""
    primary_key: str
    raws_hash: Optional[str]
    base_hash: Optional[str]
    synced: bool
    error: Optional[str] = None


class RawsBaseParityChecker:
    """
    Parity checker for RAWS-BASE twin-table architecture.
    
    Key responsibilities:
    1. Verify row counts match between RAWS and BASE
    2. Confirm every BASE record has a corresponding RAWS record
    3. Validate parity hashes for data integrity
    4. Detect synchronization errors
    5. Generate comprehensive reports
    """
    
    # Define the twin table pairs
    TWIN_TABLES = [
        ('raws_tournaments', 'base_tournaments', 'tournament_id'),
        ('raws_seasons', 'base_seasons', 'season_id'),
        ('raws_teams', 'base_teams', 'team_id'),
        ('raws_players', 'base_players', 'player_id'),
        ('raws_matches', 'base_matches', 'match_id'),
        ('raws_match_maps', 'base_match_maps', 'map_id'),
        ('raws_player_stats', 'base_player_stats', 'stat_id'),
        ('raws_team_stats', 'base_team_stats', 'stat_id'),
    ]
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = None
        self.reports: List[ParityReport] = []
        
    def connect(self):
        """Establish database connection"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        
    def disconnect(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            self.conn = None
    
    def _compute_hash(self, data: Dict) -> str:
        """
        Compute parity hash from dictionary data.
        Uses sorted keys for consistency.
        """
        # Remove parity-related fields from hash computation
        exclude_fields = {'parity_hash', 'last_synced', 'sync_status', 'sync_error', 
                          'created_at', 'updated_at', 'id'}
        
        filtered = {k: v for k, v in data.items() if k not in exclude_fields}
        # Sort by key for consistency
        hash_input = json.dumps(filtered, sort_keys=True, default=str)
        return hashlib.sha256(hash_input.encode()).hexdigest()[:32]
    
    def _get_table_columns(self, table_name: str) -> List[str]:
        """Get column names for a table"""
        cursor = self.conn.execute(f"PRAGMA table_info({table_name})")
        return [row['name'] for row in cursor.fetchall()]
    
    def _get_row_as_dict(self, table_name: str, pk_column: str, pk_value: str) -> Optional[Dict]:
        """Fetch a single row as dictionary"""
        cursor = self.conn.execute(
            f"SELECT * FROM {table_name} WHERE {pk_column} = ?",
            (pk_value,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    
    def check_table_pair(self, raws_table: str, base_table: str, pk_column: str) -> ParityReport:
        """
        Perform full parity check on a table pair.
        """
        report = ParityReport(
            table_pair=f"{raws_table} <-> {base_table}",
            raws_count=0,
            base_count=0,
            matched=0,
            orphaned_base=0,
            missing_base=0,
            hash_mismatches=0,
            sync_errors=0,
            status='ok',
            details=[]
        )
        
        # Get counts
        cursor = self.conn.execute(f"SELECT COUNT(*) as cnt FROM {raws_table}")
        report.raws_count = cursor.fetchone()['cnt']
        
        cursor = self.conn.execute(f"SELECT COUNT(*) as cnt FROM {base_table}")
        report.base_count = cursor.fetchone()['cnt']
        
        # Find orphaned BASE records (no matching RAWS)
        cursor = self.conn.execute(f"""
            SELECT b.{pk_column} 
            FROM {base_table} b 
            LEFT JOIN {raws_table} r ON b.{pk_column} = r.{pk_column}
            WHERE r.{pk_column} IS NULL
        """)
        orphaned = [row[pk_column] for row in cursor.fetchall()]
        report.orphaned_base = len(orphaned)
        
        if orphaned:
            report.details.append(f"Orphaned BASE records: {orphaned[:5]}")
            if len(orphaned) > 5:
                report.details.append(f"  ... and {len(orphaned) - 5} more")
        
        # Find missing BASE records (RAWS without BASE)
        cursor = self.conn.execute(f"""
            SELECT r.{pk_column} 
            FROM {raws_table} r 
            LEFT JOIN {base_table} b ON r.{pk_column} = b.{pk_column}
            WHERE b.{pk_column} IS NULL
        """)
        missing = [row[pk_column] for row in cursor.fetchall()]
        report.missing_base = len(missing)
        
        if missing:
            report.details.append(f"Missing BASE records for RAWS: {missing[:5]}")
            if len(missing) > 5:
                report.details.append(f"  ... and {len(missing) - 5} more")
        
        # Count sync errors
        cursor = self.conn.execute(f"""
            SELECT COUNT(*) as cnt FROM {base_table} WHERE sync_status = 'error'
        """)
        report.sync_errors = cursor.fetchone()['cnt']
        
        if report.sync_errors > 0:
            cursor = self.conn.execute(f"""
                SELECT {pk_column}, sync_error FROM {base_table} WHERE sync_status = 'error' LIMIT 5
            """)
            errors = cursor.fetchall()
            report.details.append(f"Sync errors: {report.sync_errors}")
            for err in errors:
                report.details.append(f"  {err[pk_column]}: {err['sync_error']}")
        
        # Check parity hashes for matched records
        cursor = self.conn.execute(f"""
            SELECT r.{pk_column}, r.data_hash as raws_hash, b.parity_hash as base_hash
            FROM {raws_table} r
            JOIN {base_table} b ON r.{pk_column} = b.{pk_column}
        """)
        
        hash_mismatches = []
        for row in cursor.fetchall():
            raws_hash = row['raws_hash']
            base_hash = row['base_hash']
            
            if raws_hash and base_hash and raws_hash != base_hash:
                hash_mismatches.append({
                    'pk': row[pk_column],
                    'raws_hash': raws_hash,
                    'base_hash': base_hash
                })
        
        report.hash_mismatches = len(hash_mismatches)
        if hash_mismatches:
            report.details.append(f"Hash mismatches: {len(hash_mismatches)}")
            for mm in hash_mismatches[:3]:
                report.details.append(f"  {mm['pk']}: RAWS={mm['raws_hash'][:8]}... BASE={mm['base_hash'][:8]}...")
        
        # Calculate matched count
        report.matched = report.raws_count - report.missing_base
        
        # Determine status
        if report.orphaned_base > 0 or report.hash_mismatches > 0:
            report.status = 'error'
        elif report.missing_base > 0 or report.sync_errors > 0:
            report.status = 'warning'
        
        return report
    
    def run_full_check(self) -> List[ParityReport]:
        """Run parity check on all table pairs"""
        self.reports = []
        
        for raws_table, base_table, pk_column in self.TWIN_TABLES:
            try:
                report = self.check_table_pair(raws_table, base_table, pk_column)
                self.reports.append(report)
            except Exception as e:
                # Create error report for failed table
                self.reports.append(ParityReport(
                    table_pair=f"{raws_table} <-> {base_table}",
                    raws_count=0,
                    base_count=0,
                    matched=0,
                    orphaned_base=0,
                    missing_base=0,
                    hash_mismatches=0,
                    sync_errors=0,
                    status='error',
                    details=[f"Exception during check: {str(e)}"]
                ))
        
        return self.reports
    
    def generate_parity_hash(self, table_name: str, pk_column: str, pk_value: str) -> Optional[str]:
        """
        Generate a new parity hash for a RAWS record.
        This should be called when data changes or for initial sync.
        """
        row = self._get_row_as_dict(table_name, pk_column, pk_value)
        if not row:
            return None
        return self._compute_hash(row)
    
    def update_parity_hash(self, table_name: str, pk_column: str, pk_value: str) -> bool:
        """
        Update the data_hash field for a RAWS record.
        Returns True if successful.
        """
        new_hash = self.generate_parity_hash(table_name, pk_column, pk_value)
        if not new_hash:
            return False
        
        self.conn.execute(
            f"UPDATE {table_name} SET data_hash = ? WHERE {pk_column} = ?",
            (new_hash, pk_value)
        )
        self.conn.commit()
        return True
    
    def sync_base_record(self, base_table: str, pk_column: str, pk_value: str, 
                         raws_table: str) -> Tuple[bool, Optional[str]]:
        """
        Synchronize a BASE record with its RAWS counterpart.
        Updates parity_hash and last_synced.
        
        Returns: (success, error_message)
        """
        try:
            # Get RAWS hash
            cursor = self.conn.execute(
                f"SELECT data_hash FROM {raws_table} WHERE {pk_column} = ?",
                (pk_value,)
            )
            row = cursor.fetchone()
            
            if not row:
                # RAWS record doesn't exist - mark as orphaned
                self.conn.execute(
                    f"""UPDATE {base_table} 
                        SET sync_status = 'orphaned', 
                            sync_error = 'RAWS record not found',
                            last_synced = ?
                        WHERE {pk_column} = ?""",
                    (datetime.now().isoformat(), pk_value)
                )
                self.conn.commit()
                return False, "RAWS record not found"
            
            raws_hash = row['data_hash']
            
            # Update BASE record
            self.conn.execute(
                f"""UPDATE {base_table} 
                    SET parity_hash = ?, 
                        last_synced = ?,
                        sync_status = 'synced',
                        sync_error = NULL
                    WHERE {pk_column} = ?""",
                (raws_hash, datetime.now().isoformat(), pk_value)
            )
            self.conn.commit()
            return True, None
            
        except Exception as e:
            # Mark sync error
            try:
                self.conn.execute(
                    f"""UPDATE {base_table} 
                        SET sync_status = 'error', 
                            sync_error = ?,
                            last_synced = ?
                        WHERE {pk_column} = ?""",
                    (str(e)[:255], datetime.now().isoformat(), pk_value)
                )
                self.conn.commit()
            except:
                pass
            return False, str(e)
    
    def repair_orphaned(self, dry_run: bool = True) -> List[Dict]:
        """
        Find and optionally delete orphaned BASE records.
        Returns list of actions taken.
        """
        actions = []
        
        for raws_table, base_table, pk_column in self.TWIN_TABLES:
            cursor = self.conn.execute(f"""
                SELECT b.{pk_column} 
                FROM {base_table} b 
                LEFT JOIN {raws_table} r ON b.{pk_column} = r.{pk_column}
                WHERE r.{pk_column} IS NULL
            """)
            
            orphaned = [row[pk_column] for row in cursor.fetchall()]
            
            for pk in orphaned:
                action = {
                    'table': base_table,
                    'primary_key': pk,
                    'action': 'delete' if not dry_run else 'would_delete'
                }
                actions.append(action)
                
                if not dry_run:
                    self.conn.execute(
                        f"DELETE FROM {base_table} WHERE {pk_column} = ?",
                        (pk,)
                    )
        
        if not dry_run:
            self.conn.commit()
        
        return actions
    
    def repair_missing_base(self, dry_run: bool = True) -> List[Dict]:
        """
        Find RAWS records without BASE counterparts.
        These need to have BASE records created (out of scope for this script).
        Returns list of missing records.
        """
        missing = []
        
        for raws_table, base_table, pk_column in self.TWIN_TABLES:
            cursor = self.conn.execute(f"""
                SELECT r.{pk_column} 
                FROM {raws_table} r 
                LEFT JOIN {base_table} b ON r.{pk_column} = b.{pk_column}
                WHERE b.{pk_column} IS NULL
            """)
            
            for row in cursor.fetchall():
                missing.append({
                    'raws_table': raws_table,
                    'base_table': base_table,
                    'primary_key': row[pk_column],
                    'action': 'create_base_record'
                })
        
        return missing
    
    def print_report(self, reports: Optional[List[ParityReport]] = None):
        """Print formatted parity report to stdout"""
        if reports is None:
            reports = self.reports
        
        print("=" * 80)
        print("RAWS-BASE PARITY CHECK REPORT")
        print(f"Generated: {datetime.now().isoformat()}")
        print("=" * 80)
        print()
        
        total_errors = 0
        total_warnings = 0
        
        for report in reports:
            # Color coding for terminal
            status_icon = "✓" if report.status == 'ok' else "⚠" if report.status == 'warning' else "✗"
            
            print(f"{status_icon} {report.table_pair}")
            print(f"   RAWS: {report.raws_count} | BASE: {report.base_count} | Matched: {report.matched}")
            
            if report.orphaned_base > 0:
                print(f"   ❌ Orphaned BASE: {report.orphaned_base}")
                total_errors += report.orphaned_base
            
            if report.missing_base > 0:
                print(f"   ⚠ Missing BASE: {report.missing_base}")
                total_warnings += report.missing_base
            
            if report.hash_mismatches > 0:
                print(f"   ❌ Hash mismatches: {report.hash_mismatches}")
                total_errors += report.hash_mismatches
            
            if report.sync_errors > 0:
                print(f"   ⚠ Sync errors: {report.sync_errors}")
                total_warnings += report.sync_errors
            
            for detail in report.details:
                print(f"      • {detail}")
            
            print()
        
        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        
        if total_errors == 0 and total_warnings == 0:
            print("✓ All tables synchronized. No issues found.")
        else:
            if total_errors > 0:
                print(f"✗ Critical issues: {total_errors}")
            if total_warnings > 0:
                print(f"⚠ Warnings: {total_warnings}")
        
        print()
    
    def export_json_report(self, filepath: str):
        """Export report to JSON file"""
        data = {
            'generated_at': datetime.now().isoformat(),
            'database': self.db_path,
            'reports': [asdict(r) for r in self.reports]
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        return filepath


def init_database(db_path: str):
    """Initialize database with RAWS and BASE schemas"""
    conn = sqlite3.connect(db_path)
    
    # Read and execute RAWS schema
    with open('raws_schema.sql', 'r') as f:
        conn.executescript(f.read())
    
    # Read and execute BASE schema
    with open('base_schema.sql', 'r') as f:
        conn.executescript(f.read())
    
    conn.commit()
    conn.close()
    print(f"Database initialized: {db_path}")


def main():
    parser = argparse.ArgumentParser(
        description='RAWS-BASE Parity Checker for SATOR-eXe-ROTAS'
    )
    parser.add_argument('--db', default='raws_base.db', help='Database path')
    parser.add_argument('--init', action='store_true', help='Initialize database with schemas')
    parser.add_argument('--check', action='store_true', help='Run parity check')
    parser.add_argument('--repair', action='store_true', help='Repair orphaned records')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be repaired')
    parser.add_argument('--json', metavar='FILE', help='Export report to JSON')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    if args.init:
        init_database(args.db)
        return 0
    
    if not Path(args.db).exists():
        print(f"Database not found: {args.db}")
        print("Run with --init to create it")
        return 1
    
    checker = RawsBaseParityChecker(args.db)
    checker.connect()
    
    try:
        if args.repair or args.dry_run:
            print("Checking for orphaned BASE records...")
            actions = checker.repair_orphaned(dry_run=args.dry_run)
            
            if actions:
                print(f"Found {len(actions)} orphaned records:")
                for action in actions[:10]:
                    print(f"  {action['action'].upper()}: {action['table']}.{action['primary_key']}")
                if len(actions) > 10:
                    print(f"  ... and {len(actions) - 10} more")
            else:
                print("No orphaned records found.")
            
            print("\nChecking for missing BASE records...")
            missing = checker.repair_missing_base()
            
            if missing:
                print(f"Found {len(missing)} RAWS records without BASE:")
                for m in missing[:10]:
                    print(f"  NEEDS BASE: {m['base_table']}.{m['primary_key']}")
                if len(missing) > 10:
                    print(f"  ... and {len(missing) - 10} more")
            else:
                print("All RAWS records have BASE counterparts.")
        
        if args.check or not args.repair:
            reports = checker.run_full_check()
            checker.print_report(reports)
            
            if args.json:
                checker.export_json_report(args.json)
                print(f"Report exported to: {args.json}")
            
            # Return non-zero if errors found
            has_errors = any(r.status == 'error' for r in reports)
            return 1 if has_errors else 0
    
    finally:
        checker.disconnect()
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
