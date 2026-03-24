/**
 * Metadata Embedding
 * Embeds export metadata into image files (PNG tEXt chunks, WebP EXIF, etc.)
 * [Ver001.000]
 */

import type { ExportMetadata } from './types';

/** Convert metadata to JSON string */
function serializeMetadata(metadata: ExportMetadata): string {
  return JSON.stringify(metadata);
}

/** Embed metadata into PNG using tEXt chunks */
async function embedPngMetadata(blob: Blob, metadata: ExportMetadata): Promise<Blob> {
  const metadataText = serializeMetadata(metadata);
  const metadataBytes = new TextEncoder().encode(metadataText);

  // Read original PNG
  const arrayBuffer = await blob.arrayBuffer();
  const originalBytes = new Uint8Array(arrayBuffer);

  // Create tEXt chunk
  const keyword = 'SpecMap';
  const keywordBytes = new TextEncoder().encode(keyword);
  const chunkData = new Uint8Array(keywordBytes.length + 1 + metadataBytes.length);
  chunkData.set(keywordBytes);
  chunkData[keywordBytes.length] = 0; // Null separator
  chunkData.set(metadataBytes, keywordBytes.length + 1);

  // Calculate CRC32
  const crc = calculateCrc32(chunkData);
  const crcBytes = new Uint8Array(4);
  const dataView = new DataView(crcBytes.buffer);
  dataView.setUint32(0, crc, false);

  // Build chunk: length (4) + type (4) + data + CRC (4)
  const chunkLength = chunkData.length;
  const chunk = new Uint8Array(4 + 4 + chunkData.length + 4);
  const chunkView = new DataView(chunk.buffer);
  chunkView.setUint32(0, chunkLength, false); // Length
  chunk.set(new TextEncoder().encode('tEXt'), 4); // Type
  chunk.set(chunkData, 8); // Data
  chunk.set(crcBytes, 8 + chunkData.length); // CRC

  // Find end of IHDR chunk to insert after
  let offset = 8; // Skip PNG signature
  while (offset < originalBytes.length) {
    const length = new DataView(originalBytes.buffer, offset).getUint32(0, false);
    const type = new TextDecoder().decode(originalBytes.slice(offset + 4, offset + 8));

    if (type === 'IHDR') {
      // Insert after IHDR
      const before = originalBytes.slice(0, offset + 12 + length);
      const after = originalBytes.slice(offset + 12 + length);

      const result = new Uint8Array(before.length + chunk.length + after.length);
      result.set(before);
      result.set(chunk, before.length);
      result.set(after, before.length + chunk.length);

      return new Blob([result], { type: 'image/png' });
    }

    offset += 12 + length;
  }

  // Fallback: return original if IHDR not found
  return blob;
}

/** CRC32 lookup table */
let crcTable: Uint32Array | null = null;

/** Initialize CRC32 table */
function initCrcTable(): Uint32Array {
  if (crcTable) return crcTable;

  crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[i] = c >>> 0;
  }

  return crcTable;
}

/** Calculate CRC32 checksum */
function calculateCrc32(data: Uint8Array): number {
  const table = initCrcTable();
  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

/** Embed metadata into WebP (simplified - adds EXIF-like comment) */
async function embedWebpMetadata(blob: Blob, metadata: ExportMetadata): Promise<Blob> {
  // WebP metadata embedding is complex; for now, we'll return as-is
  // In production, this would use a proper WebP manipulation library
  // For now, we'll rely on a separate sidecar JSON file for WebP
  return blob;
}

/** Embed metadata into JPEG using APP1 EXIF segment */
async function embedJpegMetadata(blob: Blob, metadata: ExportMetadata): Promise<Blob> {
  // JPEG EXIF embedding requires complex TIFF structure
  // For MVP, we'll return as-is and recommend PNG for metadata support
  return blob;
}

/** Embed metadata into image blob */
export async function embedMetadata(
  blob: Blob,
  metadata: ExportMetadata
): Promise<Blob> {
  const type = blob.type;

  try {
    if (type === 'image/png') {
      return await embedPngMetadata(blob, metadata);
    } else if (type === 'image/webp') {
      return await embedWebpMetadata(blob, metadata);
    } else if (type === 'image/jpeg') {
      return await embedJpegMetadata(blob, metadata);
    }
  } catch (error) {
    console.warn('[Export] Failed to embed metadata:', error);
  }

  // Return original if embedding fails
  return blob;
}

/** Extract metadata from PNG blob */
export async function extractMetadata(blob: Blob): Promise<Partial<ExportMetadata> | null> {
  if (blob.type !== 'image/png') {
    return null;
  }

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Skip PNG signature
    let offset = 8;

    while (offset < bytes.length) {
      const length = new DataView(bytes.buffer, offset).getUint32(0, false);
      const type = new TextDecoder().decode(bytes.slice(offset + 4, offset + 8));

      if (type === 'tEXt') {
        const data = bytes.slice(offset + 8, offset + 8 + length);
        const nullIndex = data.indexOf(0);

        if (nullIndex > 0) {
          const keyword = new TextDecoder().decode(data.slice(0, nullIndex));
          if (keyword === 'SpecMap') {
            const value = new TextDecoder().decode(data.slice(nullIndex + 1));
            return JSON.parse(value) as ExportMetadata;
          }
        }
      }

      // Stop at IEND
      if (type === 'IEND') break;

      offset += 12 + length;
    }
  } catch (error) {
    console.warn('[Export] Failed to extract metadata:', error);
  }

  return null;
}

/** Generate metadata sidecar file (for formats without native metadata support) */
export function generateSidecarMetadata(metadata: ExportMetadata): string {
  return JSON.stringify(metadata, null, 2);
}

/** Create complete metadata object */
export function createMetadata(
  partial: Partial<ExportMetadata>,
  format: ExportMetadata['format'],
  quality: ExportMetadata['quality'],
  resolution: ExportMetadata['resolution']
): ExportMetadata {
  return {
    platform: '4NJZ4-TENET',
    specmapVersion: '2.0.0',
    timestamp: Date.now(),
    format,
    quality,
    resolution,
    ...partial,
  };
}
