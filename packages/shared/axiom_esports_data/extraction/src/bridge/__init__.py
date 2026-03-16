"""
Bridge module — Data transformation between VLR.gg format and KCRITR schema.
"""
from extraction.src.bridge.extraction_bridge import ExtractionBridge
from extraction.src.bridge.canonical_id import CanonicalIDResolver, CanonicalID
from extraction.src.bridge.field_translator import FieldTranslator

__all__ = [
    "ExtractionBridge",
    "CanonicalIdGenerator",
    "FieldTranslator",
]
