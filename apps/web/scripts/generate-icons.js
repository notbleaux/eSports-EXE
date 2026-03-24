#!/usr/bin/env node
/**
 * Generate PNG icons from SVGs for PWA manifest
 * Uses Node.js built-in modules to create simple PNG files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple PNG signature and chunk helpers
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

function crc32(buf) {
  let crc = 0xffffffff;
  const table = new Uint32Array(256);
  
  // Build CRC table once
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
  buf[8] = 8;  // bit depth
  buf[9] = 6;  // color type: RGBA
  buf[10] = 0; // compression
  buf[11] = 0; // filter
  buf[12] = 0; // interlace
  return createChunk('IHDR', buf);
}

function createIDAT(width, height, color) {
  const bytesPerRow = 1 + (width * 4);
  const imageData = Buffer.alloc(bytesPerRow * height);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * bytesPerRow;
    imageData[rowOffset] = 0;
    
    const gradientFactor = 1 - (y / height) * 0.3;
    const r = Math.round(color.r * gradientFactor);
    const g = Math.round(color.g * gradientFactor);
    const b = Math.round(color.b * gradientFactor);
    
    for (let x = 0; x < width; x++) {
      const offset = rowOffset + 1 + (x * 4);
      imageData[offset] = r;
      imageData[offset + 1] = g;
      imageData[offset + 2] = b;
      imageData[offset + 3] = color.a;
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

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Brand colors from the SVG - dark background
const bgColor = { r: 15, g: 15, b: 25, a: 255 };

function generateIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  
  console.log('Generating PNG icons...');
  
  for (const size of sizes) {
    const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    // Check if SVG exists
    const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
    if (!fs.existsSync(svgPath)) {
      console.log(`  Skipping ${size}x${size}: SVG not found`);
      continue;
    }
    
    // Generate simple branded PNG
    const png = createPNG(size, size, bgColor);
    fs.writeFileSync(pngPath, png);
    console.log(`  Created icon-${size}x${size}.png`);
  }
  
  console.log('Done generating icons!');
}

generateIcons();
