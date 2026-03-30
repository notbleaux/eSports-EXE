"""[Ver001.000]
Data Integrity — SHA-256 verification for all stored extractions.
"""
import hashlib
import json
import logging
from pathlib import Path
from typing import Any, Dict, Union

logger = logging.getLogger(__name__)


def compute_hash(data: Union[bytes, str, Dict[str, Any]]) -> str:
    """
    Compute SHA-256 hex digest of data.
    
    Args:
        data: Data to hash (bytes, string, or dict)
        
    Returns:
        SHA-256 hex digest string
    """
    if isinstance(data, dict):
        # Sort keys for consistent hashing
        content = json.dumps(data, sort_keys=True, separators=(',', ':'))
        data = content.encode('utf-8')
    elif isinstance(data, str):
        data = data.encode('utf-8')
    elif not isinstance(data, bytes):
        data = str(data).encode('utf-8')
    
    return hashlib.sha256(data).hexdigest()


def verify_checksum(data: Union[bytes, str, Dict[str, Any]], expected: str) -> bool:
    """
    Verify SHA-256 of data matches expected hex digest.
    
    Args:
        data: Data to verify
        expected: Expected SHA-256 hex digest
        
    Returns:
        True if checksum matches
    """
    return compute_hash(data) == expected


class IntegrityChecker:
    """
    Verifies SHA-256 checksums of all stored raw extractions.
    Called before any analytics processing.
    """
    
    def __init__(self, storage_path: Path = Path("data/raw_extractions")) -> None:
        self.storage_path = storage_path
    
    def verify_file(self, file_path: Path) -> bool:
        """Verify a single raw file's checksum matches its filename."""
        expected_checksum = file_path.stem  # filename is the checksum
        if len(expected_checksum) != 64:
            logger.warning("File %s does not appear to be named by SHA-256", file_path)
            return False
        
        try:
            content = file_path.read_text(encoding="utf-8")
            actual = hashlib.sha256(content.encode()).hexdigest()
            
            if actual != expected_checksum:
                logger.error(
                    "Checksum MISMATCH: %s. Expected %s, got %s",
                    file_path.name, expected_checksum[:12], actual[:12],
                )
                return False
            
            return True
        except Exception as e:
            logger.error(f"Failed to verify file {file_path}: {e}")
            return False
    
    def verify_all(self) -> Dict[str, bool]:
        """
        Verify all .raw files in storage. Returns {filename: passed} dict.
        """
        results = {}
        
        if not self.storage_path.exists():
            logger.warning(f"Storage path {self.storage_path} does not exist")
            return results
        
        raw_files = list(self.storage_path.glob("*.raw"))
        logger.info("Verifying %d raw extraction files", len(raw_files))
        
        for f in raw_files:
            results[f.name] = self.verify_file(f)
        
        passed = sum(1 for v in results.values() if v)
        failed = len(results) - passed
        logger.info("Integrity check: %d passed, %d failed", passed, failed)
        
        if failed > 0:
            raise RuntimeError(
                f"Integrity check failed: {failed} corrupted files detected. "
                "Do not proceed with analytics until resolved."
            )
        
        return results
    
    def compute_data_hash(self, data: Dict[str, Any]) -> str:
        """Compute hash for a data record."""
        return compute_hash(data)
    
    def sign_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add integrity signature to data.
        
        Adds an '_integrity' field with the SHA-256 hash of the data
        (excluding any existing '_integrity' field).
        
        Args:
            data: Data dictionary to sign
            
        Returns:
            Data dictionary with '_integrity' field added
        """
        # Create a copy without existing integrity field
        data_copy = {k: v for k, v in data.items() if k != '_integrity'}
        
        # Compute hash
        integrity_hash = compute_hash(data_copy)
        
        # Add integrity field
        signed_data = dict(data)
        signed_data['_integrity'] = integrity_hash
        
        return signed_data
    
    def verify_data(self, data: Dict[str, Any]) -> bool:
        """
        Verify data integrity using the '_integrity' field.
        
        Args:
            data: Data dictionary with '_integrity' field
            
        Returns:
            True if integrity check passes
        """
        if '_integrity' not in data:
            logger.warning("No '_integrity' field found in data")
            return False
        
        expected_hash = data['_integrity']
        
        # Create a copy without integrity field for verification
        data_copy = {k: v for k, v in data.items() if k != '_integrity'}
        
        actual_hash = compute_hash(data_copy)
        
        if actual_hash != expected_hash:
            logger.error(
                "Data integrity check FAILED. Expected %s, got %s",
                expected_hash[:12], actual_hash[:12]
            )
            return False
        
        return True


class IntegrityViolation(Exception):
    """Raised when data integrity verification fails."""
    pass


def main():
    """CLI for integrity checking."""
    import argparse
    logging.basicConfig(level=logging.INFO)
    
    parser = argparse.ArgumentParser(description="Data Integrity Checker")
    parser.add_argument("--verify-all", action="store_true", help="Verify all raw files")
    parser.add_argument("--path", type=str, default="data/raw_extractions", help="Storage path")
    args = parser.parse_args()
    
    if args.verify_all:
        checker = IntegrityChecker(Path(args.path))
        try:
            checker.verify_all()
            print("✅ All integrity checks passed")
        except RuntimeError as e:
            print(f"❌ {e}")
            exit(1)


if __name__ == "__main__":
    main()
