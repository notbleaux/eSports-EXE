/**
 * Mascot Generation Configuration
 * 
 * [Ver001.000]
 * 
 * Fine-tuning configuration for 3-option pipeline:
 * - Option 1: SVG (scalable, immediate)
 * - Option 2: Canvas/PNG (pixel-perfect)
 * - Option 3: CSS (zero-dependency)
 */

export interface ColorPalette {
  primary: string;
  secondary: string;
  light: string;
  dark: string;
  outline: string;
  white: string;
  black: string;
}

export interface MascotConfig {
  name: string;
  displayName: string;
  personality: string;
  colors: ColorPalette;
  features: {
    earShape: 'pointed' | 'rounded' | 'floppy';
    eyeSize: 'small' | 'medium' | 'large';
    snoutLength: 'short' | 'medium' | 'long';
    hasTail: boolean;
  };
  animations: {
    idle: string[];
    wave: string[];
    celebrate: string[];
  };
}

export interface GenerationOptions {
  /** Output sizes to generate */
  sizes: number[];
  
  /** Pixel scale factor (1 = 1px per grid unit) */
  pixelScale: number;
  
  /** Enable pixel grid overlay */
  showGrid: boolean;
  
  /** Anti-aliasing (false for pixel art) */
  antiAlias: boolean;
  
  /** Output formats */
  formats: ('svg' | 'png' | 'css' | 'json')[];
  
  /** Optimization level */
  optimization: 'none' | 'basic' | 'aggressive';
  
  /** Include metadata */
  metadata: boolean;
}

// ============================================
// MASCOT DEFINITIONS
// ============================================

export const FOX_MASCOT: MascotConfig = {
  name: 'fox',
  displayName: 'Fox',
  personality: 'Agile, clever, quick-witted',
  colors: {
    primary: '#F97316',    // Orange-500
    secondary: '#EA580C',  // Orange-600
    light: '#FB923C',      // Orange-400
    dark: '#9A3412',       // Orange-800
    outline: '#000000',
    white: '#FFFFFF',
    black: '#000000'
  },
  features: {
    earShape: 'pointed',
    eyeSize: 'medium',
    snoutLength: 'medium',
    hasTail: true
  },
  animations: {
    idle: ['blink', 'ear-twitch', 'tail-wag'],
    wave: ['raise-paw', 'wave', 'lower-paw'],
    celebrate: ['jump', 'spin', 'star-eyes']
  }
};

export const OWL_MASCOT: MascotConfig = {
  name: 'owl',
  displayName: 'Owl',
  personality: 'Wise, insightful, strategic',
  colors: {
    primary: '#6366F1',    // Indigo-500
    secondary: '#4F46E5',  // Indigo-600
    light: '#818CF8',      // Indigo-400
    dark: '#3730A3',       // Indigo-800
    outline: '#000000',
    white: '#FFFFFF',
    black: '#000000'
  },
  features: {
    earShape: 'rounded',
    eyeSize: 'large',
    snoutLength: 'short',
    hasTail: false
  },
  animations: {
    idle: ['blink', 'head-turn', 'feather-ruffle'],
    wave: ['wing-raise', 'wing-flap', 'wing-lower'],
    celebrate: ['spin', 'glasses-flash', 'book-open']
  }
};

export const WOLF_MASCOT: MascotConfig = {
  name: 'wolf',
  displayName: 'Wolf',
  personality: 'Strong, leadership, loyal',
  colors: {
    primary: '#475569',    // Slate-600
    secondary: '#334155',  // Slate-700
    light: '#64748B',      // Slate-500
    dark: '#1E293B',       // Slate-800
    outline: '#000000',
    white: '#FFFFFF',
    black: '#000000'
  },
  features: {
    earShape: 'pointed',
    eyeSize: 'medium',
    snoutLength: 'long',
    hasTail: true
  },
  animations: {
    idle: ['blink', 'ear-perk', 'pant'],
    wave: ['howl', 'paw-lift', 'nod'],
    celebrate: ['howl-loud', 'jump', 'territory-stomp']
  }
};

export const HAWK_MASCOT: MascotConfig = {
  name: 'hawk',
  displayName: 'Hawk',
  personality: 'Speed, precision, focus',
  colors: {
    primary: '#DC2626',    // Red-600
    secondary: '#B91C1C',  // Red-700
    light: '#EF4444',      // Red-500
    dark: '#991B1B',       // Red-800
    gold: '#F59E0B',       // Amber-500
    outline: '#000000',
    white: '#FFFFFF',
    black: '#000000'
  },
  features: {
    earShape: 'rounded',
    eyeSize: 'large',
    snoutLength: 'short',
    hasTail: true
  },
  animations: {
    idle: ['blink', 'head-bob', 'feather-preen'],
    wave: ['wing-salute', 'screech', 'wing-lower'],
    celebrate: ['dive', 'wing-spread', 'victory-screech']
  }
};

// Add gold to ColorPalette for hawk
declare module './config' {
  interface ColorPalette {
    gold?: string;
  }
}

export const ALL_MASCOTS = [FOX_MASCOT, OWL_MASCOT, WOLF_MASCOT, HAWK_MASCOT];

// ============================================
// DEFAULT GENERATION OPTIONS
// ============================================

export const DEFAULT_OPTIONS: GenerationOptions = {
  sizes: [32, 64, 128, 256],
  pixelScale: 2,
  showGrid: false,
  antiAlias: false,
  formats: ['svg', 'png'],
  optimization: 'basic',
  metadata: true
};

export const ICON_OPTIONS: GenerationOptions = {
  sizes: [16, 32, 64],
  pixelScale: 1,
  showGrid: false,
  antiAlias: false,
  formats: ['svg', 'png'],
  optimization: 'aggressive',
  metadata: false
};

export const HERO_OPTIONS: GenerationOptions = {
  sizes: [128, 256, 512],
  pixelScale: 4,
  showGrid: false,
  antiAlias: false,
  formats: ['svg', 'png'],
  optimization: 'basic',
  metadata: true
};

export const CSS_ONLY_OPTIONS: GenerationOptions = {
  sizes: [64],
  pixelScale: 2,
  showGrid: false,
  antiAlias: false,
  formats: ['css', 'svg'],
  optimization: 'none',
  metadata: false
};

// ============================================
// FINE-TUNING PRESETS
// ============================================

export const FINE_TUNING = {
  /** Crisp pixel art look */
  pixelPerfect: {
    antiAlias: false,
    pixelScale: 1,
    showGrid: true
  },
  
  /** Smooth for large displays */
  smooth: {
    antiAlias: true,
    pixelScale: 2,
    showGrid: false
  },
  
  /** Minimal file size */
  minimal: {
    optimization: 'aggressive' as const,
    metadata: false,
    formats: ['svg']
  },
  
  /** Maximum compatibility */
  compatible: {
    formats: ['svg', 'png', 'css'] as const,
    sizes: [32, 64, 128]
  },
  
  /** Animation-ready */
  animated: {
    formats: ['svg', 'json'] as const,
    metadata: true
  }
};
