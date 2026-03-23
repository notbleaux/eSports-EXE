/**
 * Config Hot-Reload - Recommendation #2
 * 
 * [Ver001.000]
 * 
 * Watches config.ts and auto-regenerates mascots on change
 */

import * as fs from 'fs';
import * as path from 'path';
import { MascotPipeline } from './pipeline';
import { GenerationOptions } from './config';

interface WatchOptions {
  configPath: string;
  debounceMs: number;
  onChange: () => void;
  onError: (error: Error) => void;
}

export class ConfigWatcher {
  private watcher: fs.FSWatcher | null = null;
  private lastHash: string = '';
  private debounceTimer: NodeJS.Timeout | null = null;
  private options: WatchOptions;

  constructor(options: WatchOptions) {
    this.options = options;
  }

  /**
   * Calculate file hash
   */
  private getFileHash(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath);
      return require('crypto').createHash('md5').update(content).digest('hex');
    } catch {
      return '';
    }
  }

  /**
   * Start watching
   */
  start(): void {
    if (!fs.existsSync(this.options.configPath)) {
      this.options.onError(new Error(`Config file not found: ${this.options.configPath}`));
      return;
    }

    this.lastHash = this.getFileHash(this.options.configPath);
    
    console.log(`👁️  Watching ${this.options.configPath}...`);
    
    this.watcher = fs.watch(
      this.options.configPath,
      { persistent: true },
      (eventType) => {
        if (eventType === 'change') {
          this.handleChange();
        }
      }
    );

    // Also watch the entire generator directory for changes
    const dir = path.dirname(this.options.configPath);
    fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.ts') && !filename.includes('node_modules')) {
        this.handleChange();
      }
    });
  }

  /**
   * Handle file change with debounce
   */
  private handleChange(): void {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = setTimeout(() => {
      const currentHash = this.getFileHash(this.options.configPath);
      
      // Only trigger if content actually changed
      if (currentHash !== this.lastHash) {
        console.log('🔄 Config changed, regenerating...');
        this.lastHash = currentHash;
        this.options.onChange();
      }
    }, this.options.debounceMs);
  }

  /**
   * Stop watching
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    console.log('👁️  Stopped watching');
  }
}

/**
 * Create watch mode pipeline
 */
export async function watchMode(
  configPath: string = './config.ts',
  genOptions?: GenerationOptions
): Promise<void> {
  const watcher = new ConfigWatcher({
    configPath,
    debounceMs: 500,
    onChange: async () => {
      try {
        console.log('\n🎨 Regenerating mascots...\n');
        const pipeline = new MascotPipeline({
          fineTuning: genOptions
        });
        await pipeline.run();
        console.log('\n✅ Regeneration complete. Watching for changes...\n');
      } catch (error) {
        console.error('❌ Regeneration failed:', error);
      }
    },
    onError: (error) => {
      console.error('❌ Watch error:', error);
      process.exit(1);
    }
  });

  watcher.start();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    watcher.stop();
    process.exit(0);
  });

  // Initial generation
  console.log('🎨 Initial generation...\n');
  try {
    const pipeline = new MascotPipeline({
      fineTuning: genOptions
    });
    await pipeline.run();
    console.log('\n✅ Ready. Watching for changes...\n');
  } catch (error) {
    console.error('❌ Initial generation failed:', error);
    watcher.stop();
    process.exit(1);
  }
}

export default ConfigWatcher;
