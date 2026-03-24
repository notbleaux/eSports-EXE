#!/usr/bin/env python3
"""
SATOR JLB Archive Manifest Generator
Version: 2.0
Purpose: Generate cryptographically verifiable archive manifests
"""

import os
import sys
import json
import hashlib
import argparse
import tarfile
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import subprocess


class ManifestGenerator:
    """Generate archive manifests with cryptographic checksums."""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
    
    def log(self, message: str, level: str = "INFO"):
        """Log message with level."""
        if self.verbose or level in ["ERROR", "WARNING"]:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[{timestamp}] [{level}] {message}")
    
    def sha256_file(self, filepath: str) -> str:
        """Compute SHA-256 hash of file."""
        sha256 = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        return sha256.hexdigest()
    
    def blake3_file(self, filepath: str) -> Optional[str]:
        """Compute BLAKE3 hash if available."""
        try:
            import blake3
            hasher = blake3.blake3()
            with open(filepath, 'rb') as f:
                for chunk in iter(lambda: f.read(8192), b''):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except ImportError:
            return None
    
    def extract_agent_id(self, filepath: str) -> Optional[str]:
        """Extract agent ID from filename or content."""
        basename = os.path.basename(filepath)
        
        # Try common patterns
        patterns = [
            r'(TL-[A-Z]\d+-\d+-[A-Z])',
            r'(OPT-[A-Z]\d+)',
            r'([A-Z]+-\d+-\d+-[A-Z])',
        ]
        
        import re
        for pattern in patterns:
            match = re.search(pattern, basename)
            if match:
                return match.group(1)
        
        return None
    
    def generate_file_entry(self, filepath: str, base_path: str = "") -> Dict:
        """Generate manifest entry for a single file."""
        full_path = os.path.abspath(filepath)
        rel_path = os.path.relpath(filepath, base_path) if base_path else filepath
        
        entry = {
            "path": rel_path,
            "size": os.path.getsize(filepath),
            "sha256": self.sha256_file(filepath),
            "modified_time": datetime.fromtimestamp(
                os.path.getmtime(filepath)
            ).isoformat()
        }
        
        # Optional BLAKE3 hash
        blake3_hash = self.blake3_file(filepath)
        if blake3_hash:
            entry["blake3"] = blake3_hash
        
        # Extract agent ID if available
        agent_id = self.extract_agent_id(filepath)
        if agent_id:
            entry["agent_id"] = agent_id
        
        return entry
    
    def generate_manifest(self, 
                         files: List[str],
                         archive_path: Optional[str] = None,
                         base_path: str = "",
                         metadata: Optional[Dict] = None) -> Dict:
        """Generate complete manifest for archive."""
        
        manifest = {
            "manifest_version": "2.0",
            "generated_at": datetime.now().isoformat(),
            "generator": "ManifestGenerator v2.0",
            "file_count": len(files),
            "contents": []
        }
        
        # Add custom metadata
        if metadata:
            manifest["metadata"] = metadata
        
        # Add user/agent info
        try:
            import getpass
            manifest["generated_by"] = getpass.getuser()
        except:
            manifest["generated_by"] = "unknown"
        
        # Process each file
        total_original_size = 0
        
        self.log(f"Processing {len(files)} files...")
        
        for i, filepath in enumerate(files):
            if not os.path.exists(filepath):
                self.log(f"File not found: {filepath}", "ERROR")
                continue
            
            entry = self.generate_file_entry(filepath, base_path)
            manifest["contents"].append(entry)
            total_original_size += entry["size"]
            
            if self.verbose and (i + 1) % 10 == 0:
                self.log(f"Processed {i + 1}/{len(files)} files...")
        
        manifest["total_original_size"] = total_original_size
        
        # If archive exists, add archive info
        if archive_path and os.path.exists(archive_path):
            manifest["archive"] = {
                "path": archive_path,
                "size": os.path.getsize(archive_path),
                "sha256": self.sha256_file(archive_path),
                "compression_ratio": os.path.getsize(archive_path) / total_original_size \
                    if total_original_size > 0 else 0
            }
        
        # Generate manifest checksum
        manifest_json = json.dumps(manifest, sort_keys=True)
        manifest["manifest_sha256"] = hashlib.sha256(
            manifest_json.encode('utf-8')
        ).hexdigest()
        
        return manifest
    
    def verify_archive(self, archive_path: str, manifest_path: str) -> bool:
        """Verify archive integrity against manifest."""
        self.log(f"Verifying archive: {archive_path}")
        
        # Load manifest
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
        
        # Check archive checksum
        if "archive" in manifest and "sha256" in manifest["archive"]:
            actual_hash = self.sha256_file(archive_path)
            expected_hash = manifest["archive"]["sha256"]
            
            if actual_hash != expected_hash:
                self.log(
                    f"Archive checksum mismatch! Expected: {expected_hash}, Got: {actual_hash}",
                    "ERROR"
                )
                return False
            
            self.log("Archive checksum verified ✓")
        
        # Extract and verify contents (for tar.gz)
        if archive_path.endswith('.tar.gz') or archive_path.endswith('.tgz'):
            return self._verify_tar_contents(archive_path, manifest)
        
        return True
    
    def _verify_tar_contents(self, tar_path: str, manifest: Dict) -> bool:
        """Verify contents of tar archive."""
        self.log("Verifying tar contents...")
        
        all_valid = True
        
        with tarfile.open(tar_path, 'r:gz') as tar:
            manifest_files = {entry["path"]: entry for entry in manifest["contents"]}
            
            for member in tar.getmembers():
                if not member.isfile():
                    continue
                
                if member.name not in manifest_files:
                    self.log(f"Unexpected file in archive: {member.name}", "WARNING")
                    continue
                
                expected = manifest_files[member.name]
                
                # Verify size
                if member.size != expected["size"]:
                    self.log(
                        f"Size mismatch for {member.name}: "
                        f"expected {expected['size']}, got {member.size}",
                        "ERROR"
                    )
                    all_valid = False
                
                # Extract and verify hash
                f = tar.extractfile(member)
                if f:
                    actual_hash = hashlib.sha256(f.read()).hexdigest()
                    if actual_hash != expected["sha256"]:
                        self.log(
                            f"Hash mismatch for {member.name}: "
                            f"expected {expected['sha256'][:16]}..., "
                            f"got {actual_hash[:16]}...",
                            "ERROR"
                        )
                        all_valid = False
        
        if all_valid:
            self.log("All archive contents verified ✓")
        
        return all_valid
    
    def save_manifest(self, manifest: Dict, output_path: str):
        """Save manifest to file."""
        with open(output_path, 'w') as f:
            json.dump(manifest, f, indent=2)
        self.log(f"Manifest saved: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate cryptographically verifiable archive manifests"
    )
    parser.add_argument(
        "--files",
        nargs="+",
        required=True,
        help="Files to include in manifest"
    )
    parser.add_argument(
        "--archive",
        help="Path to archive file (for integrity verification)"
    )
    parser.add_argument(
        "--base-path",
        default="",
        help="Base path for relative paths in manifest"
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Output manifest file path"
    )
    parser.add_argument(
        "--metadata",
        help="JSON string with additional metadata"
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify existing archive against manifest"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    generator = ManifestGenerator(verbose=args.verbose)
    
    if args.verify and args.archive:
        # Verification mode
        success = generator.verify_archive(args.archive, args.output)
        sys.exit(0 if success else 1)
    else:
        # Generation mode
        metadata = json.loads(args.metadata) if args.metadata else None
        
        manifest = generator.generate_manifest(
            files=args.files,
            archive_path=args.archive,
            base_path=args.base_path,
            metadata=metadata
        )
        
        generator.save_manifest(manifest, args.output)
        
        # Print summary
        print(f"\n=== MANIFEST SUMMARY ===")
        print(f"Files: {manifest['file_count']}")
        print(f"Total size: {manifest['total_original_size']:,} bytes")
        if 'archive' in manifest:
            print(f"Archive size: {manifest['archive']['size']:,} bytes")
            print(f"Compression ratio: {manifest['archive']['compression_ratio']:.2%}")
        print(f"Manifest SHA256: {manifest['manifest_sha256'][:32]}...")


if __name__ == "__main__":
    main()
