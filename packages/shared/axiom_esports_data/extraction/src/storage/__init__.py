"""
Storage module — Record tracking and integrity management.
"""
from extraction.src.storage.known_record_registry import KnownRecordRegistry, ExclusionEntry, RegistryStats
from extraction.src.storage.exclusion_list import ExclusionList, PipelineBlockedError
from extraction.src.storage.integrity_checker import IntegrityChecker, compute_checksum, verify_checksum
from extraction.src.storage.raw_repository import RawRepository
from extraction.src.storage.reconstruction_repo import ReconstructionRepo
from extraction.src.storage.example_corpus import ExampleCorpus

__all__ = [
    "KnownRecordRegistry",
    "ExclusionEntry",
    "RegistryStats",
    "ExclusionList",
    "PipelineBlockedError",
    "IntegrityChecker",
    "compute_checksum",
    "verify_checksum",
    "RawRepository",
    "ReconstructionRepo",
    "ExampleCorpus",
]
