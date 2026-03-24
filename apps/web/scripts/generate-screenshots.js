#!/usr/bin/env node
/**
 * Generate screenshot images for PWA manifest
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

function crc32(buf) {
  let crc = 0xffffffff;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createIHDR(width, height) {
  const buf = Buffer.alloc(13);
  buf.writeUInt32BE(width, 0);
  buf.writeUInt32BE(height, 4);
  buf[8] = 8;
  buf[9] = 6;
  buf[10] = 0;
  buf[11] = 0;
  buf[12] = 0;
  return createChunk('IHDR', buf);
}

function createIDAT(width, height, baseColor) {
  const bytesPerRow = 1 + (width * 4);
  const imageData = Buffer.alloc(bytesPerRow * height);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * bytesPerRow;
    imageData[rowOffset] = 0;
    
    // Gradient from top to bottom
    const gradientFactor = 1 - (y / height) * 0.4;
    const r = Math.round(baseColor.r * gradientFactor);
    const g = Math.round(baseColor.g * gradientFactor);
    const b = Math.round(baseColor.b * gradientFactor);
    
    for (let x = 0; x < width; x++) {
      const offset = rowOffset + 1 + (x * 4);
      imageData[offset] = r;
      imageData[offset + 1] = g;
      imageData[offset + 2] = b;
      imageData[offset + 3] = baseColor.a;
    }
  }
  
  const compressed = zlib.deflateSync(imageData);
  return createChunk('IDAT', compressed);
}

function createIEND() {
  return createChunk('IEND', Buffer.alloc(0));
}

function createPNG(width, height, color) {
  return Buffer.concat([
    PNG_SIGNATURE,
    createIHDR(width, height),
    createIDAT(width, height, color),
    createIEND()
  ]);
}

// Create screenshots directory if needed
const screenshotsDir = path.join(__dirname, '..', 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Brand dark color
const bgColor = { r: 15, g: 15, b: 25, a: 255 };

console.log('Generating screenshots...');

// Wide screenshot: 1280x720
const widePNG = createPNG(1280, 720, bgColor);
fs.writeFileSync(path.join(screenshotsDir, 'wide.png'), widePNG);
console.log('  Created wide.png (1280x720)');

// Narrow screenshot: 750x1334
const narrowPNG = createPNG(750, 1334, bgColor);
fs.writeFileSync(path.join(screenshotsDir, 'narrow.png'), narrowPNG);
console.log('  Created narrow.png (750x1334)');

console.log('Done generating screenshots!');
