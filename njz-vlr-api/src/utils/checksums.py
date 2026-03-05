"""
SHA-256 Checksum Utilities
Data integrity verification for RAWS storage
"""

import hashlib
from typing import Optional


def calculate_sha256(data: str) -> str:
    """
    Calculate SHA-256 checksum of string data
    
    Args:
        data: String to hash
    
    Returns:
        Hexadecimal SHA-256 hash
    """
    if not data:
        return ""
    
    if isinstance(data, str):
        data = data.encode('utf-8')
    
    return hashlib.sha256(data).hexdigest()


def calculate_sha256_file(file_path: str) -> str:
    """
    Calculate SHA-256 checksum of file
    
    Args:
        file_path: Path to file
    
    Returns:
        Hexadecimal SHA-256 hash
    """
    sha256_hash = hashlib.sha256()
    
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    
    return sha256_hash.hexdigest()


def verify_checksum(data: str, expected_hash: str) -> bool:
    """
    Verify data integrity against expected hash
    
    Args:
        data: Data to verify
        expected_hash: Expected SHA-256 hash
    
    Returns:
        True if checksum matches
    """
    if not expected_hash:
        return False
    
    actual_hash = calculate_sha256(data)
    return actual_hash.lower() == expected_hash.lower()


def short_hash(full_hash: str, length: int = 16) -> str:
    """
    Get shortened version of hash for display
    
    Args:
        full_hash: Full SHA-256 hash
        length: Number of characters to show
    
    Returns:
        Shortened hash with ellipsis
    """
    if not full_hash:
        return ""
    
    if len(full_hash) <= length:
        return full_hash
    
    return f"{full_hash[:length]}..."