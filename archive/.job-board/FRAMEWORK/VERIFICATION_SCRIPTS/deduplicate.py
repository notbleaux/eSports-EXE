#!/usr/bin/env python3
"""
SATOR JLB Deduplication Script
Version: 2.0
Purpose: Remove duplicate files before archiving
"""

import os
import sys
import hashlib
import argparse
from pathlib import Path
from collections import defaultdict
from datetime import datetime
from typing import List, Dict, Tuple, Set
import json


class Deduplicator:
    """Find and handle duplicate files."""
    
    def __init__(self, verbose: bool = False, dry_run: bool = False):
        self.verbose = verbose
        self.dry_run = dry_run
        self.duplicates_found = 0
        self.space_saved = 0
    
    def log(self, message: str, level: str = "INFO"):
        """Log message with level."""
        if self.verbose or level in ["ERROR", "WARNING"]:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[{timestamp}] [{level}] {message}")
    
    def hash_file(self, filepath: str, algorithm: str = "sha256") -> str:
        """Compute file hash."""
        if algorithm == "sha256":
            hasher = hashlib.sha256()
        elif algorithm == "md5":
            hasher = hashlib.md5()
        else:
            raise ValueError(f"Unknown algorithm: {algorithm}")
        
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                hasher.update(chunk)
        
        return hasher.hexdigest()
    
    def find_duplicates(self, 
                       files: List[str],
                       algorithm: str = "sha256") -> Dict[str, List[str]]:
        """
        Find duplicate files based on content hash.
        Returns: {hash: [file1, file2, ...]}
        """
        self.log(f"Scanning {len(files)} files for duplicates...")
        
        hashes = defaultdict(list)
        
        for i, filepath in enumerate(files):
            if not os.path.exists(filepath):
                self.log(f"File not found: {filepath}", "WARNING")
                continue
            
            try:
                file_hash = self.hash_file(filepath, algorithm)
                hashes[file_hash].append(filepath)
                
                if self.verbose and (i + 1) % 10 == 0:
                    self.log(f"Hashed {i + 1}/{len(files)} files...")
                    
            except Exception as e:
                self.log(f"Error hashing {filepath}: {e}", "ERROR")
        
        # Filter to only duplicates
        duplicates = {h: paths for h, paths in hashes.items() if len(paths) > 1}
        
        return duplicates
    
    def find_duplicates_fast(self, 
                            files: List[str],
                            algorithm: str = "sha256") -> Dict[str, List[str]]:
        """
        Fast deduplication using size-first filtering.
        """
        self.log("Fast deduplication: size filtering first...")
        
        # Group by size first (cheap)
        size_groups = defaultdict(list)
        for filepath in files:
            if os.path.exists(filepath):
                size_groups[os.path.getsize(filepath)].append(filepath)
        
        # Only hash files with same size
        duplicates = {}
        for size, same_size_files in size_groups.items():
            if len(same_size_files) > 1:
                # Now hash these candidates
                hashes = defaultdict(list)
                for filepath in same_size_files:
                    try:
                        file_hash = self.hash_file(filepath, algorithm)
                        hashes[file_hash].append(filepath)
                    except Exception as e:
                        self.log(f"Error hashing {filepath}: {e}", "ERROR")
                
                # Add true duplicates
                for h, paths in hashes.items():
                    if len(paths) > 1:
                        duplicates[h] = paths
        
        return duplicates
    
    def select_canonical(self, duplicate_paths: List[str]) -> Tuple[str, List[str]]:
        """
        Select canonical file from duplicates.
        Strategy: prefer files in 03_COMPLETED/ over 02_CLAIMED/
        """
        # Priority: 03_COMPLETED > 02_CLAIMED > others
        priority_dirs = [
            ".job-board/03_COMPLETED",
            ".job-board/02_CLAIMED",
        ]
        
        # Sort by priority
        def get_priority(path):
            for i, prefix in enumerate(priority_dirs):
                if path.startswith(prefix):
                    return i
            return len(priority_dirs)
        
        sorted_paths = sorted(duplicate_paths, key=get_priority)
        canonical = sorted_paths[0]
        duplicates = sorted_paths[1:]
        
        return canonical, duplicates
    
    def generate_deduplication_report(self,
                                      duplicates: Dict[str, List[str]],
                                      output_path: str):
        """Generate deduplication report."""
        report = {
            "generated_at": datetime.now().isoformat(),
            "deduplicator": "Deduplicator v2.0",
            "summary": {
                "duplicate_groups": len(duplicates),
                "total_duplicates": sum(len(paths) - 1 for paths in duplicates.values()),
                "space_saved_bytes": 0
            },
            "duplicates": []
        }
        
        total_space_saved = 0
        
        for file_hash, paths in duplicates.items():
            canonical, duplicates_list = self.select_canonical(paths)
            
            # Calculate space saved
            file_size = os.path.getsize(canonical)
            space_saved = file_size * len(duplicates_list)
            total_space_saved += space_saved
            
            report["duplicates"].append({
                "hash": file_hash,
                "canonical": canonical,
                "duplicates": duplicates_list,
                "file_size": file_size,
                "space_saved": space_saved
            })
        
        report["summary"]["space_saved_bytes"] = total_space_saved
        report["summary"]["space_saved_mb"] = total_space_saved / (1024 * 1024)
        
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        self.log(f"Deduplication report saved: {output_path}")
        return report
    
    def get_unique_files(self, 
                        files: List[str],
                        duplicates: Dict[str, List[str]]) -> List[str]:
        """Get list of unique files (canonical from each duplicate group + non-duplicates)."""
        unique = set()
        duplicate_set = set()
        
        for paths in duplicates.values():
            canonical, dups = self.select_canonical(paths)
            unique.add(canonical)
            duplicate_set.update(dups)
        
        # Add non-duplicate files
        for filepath in files:
            if filepath not in duplicate_set:
                unique.add(filepath)
        
        return sorted(list(unique))
    
    def deduplicate(self, 
                   files: List[str],
                   output_report: Optional[str] = None) -> List[str]:
        """
        Main deduplication entry point.
        Returns: List of unique files to archive
        """
        self.log("=== JLB DEDUPLICATION ===")
        
        # Find duplicates
        duplicates = self.find_duplicates_fast(files)
        
        if not duplicates:
            self.log("No duplicates found ✓")
            return files
        
        self.log(f"Found {len(duplicates)} duplicate groups")
        
        # Generate report
        if output_report:
            report = self.generate_deduplication_report(duplicates, output_report)
            
            print(f"\n=== DEDUPLICATION SUMMARY ===")
            print(f"Duplicate groups: {report['summary']['duplicate_groups']}")
            print(f"Total duplicates: {report['summary']['total_duplicates']}")
            print(f"Space saved: {report['summary']['space_saved_mb']:.2f} MB")
        
        # Get unique files
        unique_files = self.get_unique_files(files, duplicates)
        
        self.log(f"Original files: {len(files)}")
        self.log(f"Unique files: {len(unique_files)}")
        self.log(f"Removed duplicates: {len(files) - len(unique_files)}")
        
        return unique_files


def main():
    parser = argparse.ArgumentParser(
        description="Deduplicate files before archiving"
    )
    parser.add_argument(
        "--files",
        nargs="+",
        required=True,
        help="Files to deduplicate"
    )
    parser.add_argument(
        "--output-report",
        help="Output deduplication report path"
    )
    parser.add_argument(
        "--output-list",
        help="Output file with list of unique files"
    )
    parser.add_argument(
        "--algorithm",
        default="sha256",
        choices=["sha256", "md5"],
        help="Hash algorithm"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    deduplicator = Deduplicator(
        verbose=args.verbose,
        dry_run=args.dry_run
    )
    
    unique_files = deduplicator.deduplicate(
        files=args.files,
        output_report=args.output_report
    )
    
    # Output list of unique files
    if args.output_list:
        with open(args.output_list, 'w') as f:
            for filepath in unique_files:
                f.write(f"{filepath}\n")
        print(f"Unique file list saved: {args.output_list}")
    else:
        print("\n=== UNIQUE FILES ===")
        for filepath in unique_files:
            print(filepath)


if __name__ == "__main__":
    main()
