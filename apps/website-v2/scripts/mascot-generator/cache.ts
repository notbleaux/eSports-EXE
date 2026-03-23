/**
 * Smart Caching System - Recommendation #1
 * 
 * [Ver001.000]
 * 
 * Caches generated assets by config hash to skip regeneration
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { MascotConfig, GenerationOptions } from './config.js';

interface CacheEntry {
  hash: string;
  timestamp: number;
  files: string[];
  config: MascotConfig;
  options: GenerationOptions;
}

interface CacheIndex {
  version: string;
  entries: Record<string, CacheEntry>;
}

export class MascotCache {
  private cacheDir: string;
  private indexPath: string;
  private index: CacheIndex;

  constructor(cacheDir: string = '.mascot-cache') {
    this.cacheDir = cacheDir;
    this.indexPath = path.join(cacheDir, 'index.json');
    this.index = this.loadIndex();
  }

  /**
   * Generate hash from config and options
   */
  private generateHash(config: MascotConfig, options: GenerationOptions): string {
    const data = JSON.stringify({ config, options });
    return crypto.createHash('md5').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Load cache index from disk
   */
  private loadIndex(): CacheIndex {
    if (fs.existsSync(this.indexPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.indexPath, 'utf-8'));
      } catch {
        return { version: '1.0', entries: {} };
      }
    }
    return { version: '1.0', entries: {} };
  }

  /**
   * Save cache index to disk
   */
  private saveIndex(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
  }

  /**
   * Check if valid cache exists
   */
  has(config: MascotConfig, options: GenerationOptions): boolean {
    const hash = this.generateHash(config, options);
    const entry = this.index.entries[config.name];
    
    if (!entry) return false;
    if (entry.hash !== hash) return false;
    
    // Verify all files still exist
    const allExist = entry.files.every(f => fs.existsSync(f));
    if (!allExist) {
      delete this.index.entries[config.name];
      this.saveIndex();
      return false;
    }
    
    return true;
  }

  /**
   * Get cached files
   */
  get(config: MascotConfig, options: GenerationOptions): string[] | null {
    if (!this.has(config, options)) return null;
    return this.index.entries[config.name].files;
  }

  /**
   * Store files in cache
   */
  set(config: MascotConfig, options: GenerationOptions, files: string[]): void {
    const hash = this.generateHash(config, options);
    
    this.index.entries[config.name] = {
      hash,
      timestamp: Date.now(),
      files,
      config,
      options
    };
    
    this.saveIndex();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.index.entries = {};
    this.saveIndex();
    
    // Remove cache directory
    if (fs.existsSync(this.cacheDir)) {
      fs.rmSync(this.cacheDir, { recursive: true, force: true });
    }
  }

  /**
   * Get cache statistics
   */
  stats(): { entries: number; totalSize: number; hitRate: number } {
    const entries = Object.keys(this.index.entries).length;
    
    let totalSize = 0;
    Object.values(this.index.entries).forEach(entry => {
      entry.files.forEach(f => {
        if (fs.existsSync(f)) {
          totalSize += fs.statSync(f).size;
        }
      });
    });
    
    return {
      entries,
      totalSize,
      hitRate: 0 // Would track in production
    };
  }

  /**
   * Invalidate stale entries (older than maxAge)
   */
  invalidateStale(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleared = 0;
    
    Object.entries(this.index.entries).forEach(([name, entry]) => {
      if (now - entry.timestamp > maxAgeMs) {
        // Delete files
        entry.files.forEach(f => {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        });
        
        delete this.index.entries[name];
        cleared++;
      }
    });
    
    if (cleared > 0) {
      this.saveIndex();
    }
    
    return cleared;
  }
}

export default MascotCache;
