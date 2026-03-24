/**
 * New Mascot Configurations - Inspired Styles
 * 
 * [Ver001.000]
 * 
 * Dropout Bear: Kanye West Graduation-inspired
 * NJ Bunny: NewJeans-inspired minimalist bunny
 */

import type { ColorPalette, MascotConfig } from './config';

// ============================================
// STYLE 1: DROPOUT BEAR (Kanye West Inspired)
// ============================================

export const DROPOUT_BEAR_MASCOT: MascotConfig & { styleVariants: string[] } = {
  name: 'dropout-bear',
  displayName: 'Dropout Bear',
  personality: 'Confident, creative, trailblazer - represents artistic vision and breaking boundaries',
  colors: {
    primary: '#8B4513',    // Saddle Brown - main fur
    secondary: '#D2691E',  // Chocolate - fur highlights
    light: '#DEB887',      // Burlywood - snout/inner ears
    dark: '#5D3A1A',       // Dark Brown - shadows
    outline: '#2D1810',    // Dark outline
    white: '#FFFFFF',
    black: '#1A1A1A'
  },
  features: {
    earShape: 'rounded',
    eyeSize: 'large',
    snoutLength: 'short',
    hasTail: false
  },
  animations: {
    idle: ['blink', 'head-nod', 'jacket-adjust'],
    wave: ['paw-raise', 'dip', 'paw-lower'],
    celebrate: ['graduation-toss', 'mic-drop', 'crowd-surf']
  },
  styleVariants: [
    'homecoming',        // Pink/brown colorway
    'graduation',        // Purple/gold colorway  
    'late-registration', // Maroon/formal
    'yeezus',           // Minimal/black
    'donda'             // All black masked
  ]
};

// Variant colorways for Dropout Bear
export const BEAR_VARIANT_COLORS = {
  homecoming: {
    primary: '#8B4513',
    secondary: '#FF69B4',  // Hot pink jacket
    light: '#DEB887',
    dark: '#5D3A1A',
    accent: '#FF1493',     // Deep pink
    outline: '#2D1810'
  },
  graduation: {
    primary: '#8B4513',
    secondary: '#800080',  // Purple jacket
    light: '#DEB887',
    dark: '#5D3A1A',
    accent: '#FFD700',     // Gold
    outline: '#2D1810'
  },
  'late-registration': {
    primary: '#8B4513',
    secondary: '#800000',  // Maroon jacket
    light: '#DEB887',
    dark: '#5D3A1A',
    accent: '#C0C0C0',     // Silver
    outline: '#2D1810'
  },
  yeezus: {
    primary: '#4A4A4A',    // Dark gray
    secondary: '#1A1A1A',  // Black
    light: '#808080',
    dark: '#0D0D0D',
    accent: '#FF0000',     // Red accent
    outline: '#000000'
  },
  donda: {
    primary: '#1A1A1A',    // Black
    secondary: '#0D0D0D',  // Darker black
    light: '#333333',
    dark: '#000000',
    accent: '#FFFFFF',     // White accent
    outline: '#000000'
  }
};

// ============================================
// STYLE 2: NJ BUNNY (NewJeans Inspired)
// ============================================

export const NJ_BUNNY_MASCOT: MascotConfig & { 
  styleVariants: string[];
  lineArtStyle: boolean;
} = {
  name: 'nj-bunny',
  displayName: 'NJ Bunny',
  personality: 'Playful, trendy, youthful - represents fresh energy and modern style',
  colors: {
    primary: '#0000FF',    // Electric Blue - line color
    secondary: '#4169E1',  // Royal Blue
    light: '#87CEEB',      // Sky Blue
    dark: '#00008B',       // Dark Blue
    outline: '#0000FF',    // Blue outline (line art style)
    white: '#FFFFFF',
    black: '#000000'
  },
  features: {
    earShape: 'floppy',
    eyeSize: 'large',
    snoutLength: 'short',
    hasTail: true
  },
  animations: {
    idle: ['ear-wiggle', 'nose-twitch', 'blink'],
    wave: ['ear-wave', 'paw-wave', 'hop'],
    celebrate: ['star-jump', 'heart-eyes', 'spin']
  },
  styleVariants: [
    'classic-blue',     // Single blue line art
    'attention',        // Pink accents
    'hype-boy',         // Mint accents  
    'cookie',           // Full color version
    'ditto'             // Minimalist ghost
  ],
  lineArtStyle: true
};

// Variant styles for NJ Bunny
export const BUNNY_VARIANT_COLORS = {
  'classic-blue': {
    stroke: '#0000FF',
    fill: 'none',
    accent: '#0000FF'
  },
  'attention': {
    stroke: '#FF69B4',     // Pink
    fill: 'none',
    accent: '#FFB6C1'      // Light pink
  },
  'hype-boy': {
    stroke: '#00CED1',     // Dark turquoise
    fill: 'none',
    accent: '#98FF98'      // Mint
  },
  'cookie': {
    stroke: '#8B4513',     // Brown (cookie color)
    fill: '#DEB887',       // Filled cookie color
    accent: '#FFD700'      // Gold (chips)
  },
  'ditto': {
    stroke: '#E0E0E0',     // Light gray
    fill: 'none',
    accent: '#FFFFFF'
  }
};

// ============================================
// GENERATION OPTIONS FOR NEW MASCOTS
// ============================================

export const BEAR_GENERATION_OPTIONS = {
  sizes: [32, 64, 128, 256, 512],
  pixelScale: 2,
  showGrid: false,
  antiAlias: false,
  formats: ['svg', 'css'],
  optimization: 'basic',
  metadata: true,
  // Bear-specific options
  includeVariants: true,
  variantStyles: Object.keys(BEAR_VARIANT_COLORS),
  clothingStyle: 'varsity-jacket'
};

export const BUNNY_GENERATION_OPTIONS = {
  sizes: [32, 64, 128, 256, 512],
  pixelScale: 2,
  showGrid: false,
  antiAlias: false,
  formats: ['svg', 'css'],
  optimization: 'basic',
  metadata: true,
  // Bunny-specific options
  includeVariants: true,
  variantStyles: Object.keys(BUNNY_VARIANT_COLORS),
  lineArtMode: true,
  strokeWidth: 2
};

// ============================================
// EXPORT ALL NEW MASCOTS
// ============================================

export const NEW_MASCOTS = [
  DROPOUT_BEAR_MASCOT,
  NJ_BUNNY_MASCOT
];

export const ALL_VARIANTS = {
  bear: BEAR_VARIANT_COLORS,
  bunny: BUNNY_VARIANT_COLORS
};

// Helper to get variant colors
export function getVariantColors(mascot: 'bear' | 'bunny', variant: string): Record<string, string> | null {
  if (mascot === 'bear') {
    return BEAR_VARIANT_COLORS[variant as keyof typeof BEAR_VARIANT_COLORS] || null;
  }
  if (mascot === 'bunny') {
    return BUNNY_VARIANT_COLORS[variant as keyof typeof BUNNY_VARIANT_COLORS] || null;
  }
  return null;
}

// Helper to check if mascot supports variants
export function hasVariants(mascotName: string): boolean {
  return ['dropout-bear', 'nj-bunny'].includes(mascotName);
}

// Get all variant names for a mascot
export function getVariantNames(mascotName: string): string[] {
  if (mascotName === 'dropout-bear') {
    return DROPOUT_BEAR_MASCOT.styleVariants;
  }
  if (mascotName === 'nj-bunny') {
    return NJ_BUNNY_MASCOT.styleVariants;
  }
  return [];
}
