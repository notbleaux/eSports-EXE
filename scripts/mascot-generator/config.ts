/**
 * Mascot Generator Configuration
 * 
 * Complete configuration for all 14 mascots (7 animals × 2 styles)
 * Used by the mascot generator script and component integration
 * 
 * [Ver004.000]
 */

// ===== STYLE CONFIGURATION =====

export const MASCOT_STYLES = ['dropout', 'nj'] as const;
export type MascotStyle = typeof MASCOT_STYLES[number];

export const STYLE_CONFIG: Record<MascotStyle, {
  name: string;
  description: string;
  colorScheme: string[];
  strokeWidth: number;
  defaultSize: number;
}> = {
  dropout: {
    name: 'Dropout',
    description: 'Full-color cartoon style with rich gradients and detailed shading',
    colorScheme: ['#F48C06', '#6A040F', '#370617', '#FFD60A', '#7B2CBF', '#FF9E00'],
    strokeWidth: 0,
    defaultSize: 128,
  },
  nj: {
    name: 'NJ',
    description: 'Minimalist line art with electric blue strokes and simple geometric shapes',
    colorScheme: ['#0000FF', '#0066FF', '#00AAFF', '#4444FF', '#6666FF'],
    strokeWidth: 2,
    defaultSize: 128,
  },
};

// ===== ANIMAL TYPES =====

export const MASCOT_ANIMALS = ['fox', 'owl', 'wolf', 'hawk', 'bear', 'bunny', 'cat'] as const;
export type MascotAnimal = typeof MASCOT_ANIMALS[number];

// ===== COMPLETE MASCOT CONFIGURATION (14 mascots) =====

export interface MascotConfig {
  id: string;
  animal: MascotAnimal;
  style: MascotStyle;
  componentName: string;
  displayName: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  sizes: number[];
  animations: string[];
  variants?: string[];
  filePath: string;
}

export const MASCOT_CONFIGS: MascotConfig[] = [
  // === DROPOUT STYLE (7 mascots) ===
  {
    id: 'fox-dropout',
    animal: 'fox',
    style: 'dropout',
    componentName: 'FoxDropout',
    displayName: 'Fox (Dropout)',
    description: 'Street-smart fox with bomber jacket, confident stance',
    colors: {
      primary: '#F48C06',
      secondary: '#6A040F',
      accent: '#FFD60A',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'wave', 'celebrate', 'confident'],
    filePath: 'src/components/mascots/generated/dropout/FoxDropout.tsx',
  },
  {
    id: 'owl-dropout',
    animal: 'owl',
    style: 'dropout',
    componentName: 'OwlDropout',
    displayName: 'Owl (Dropout)',
    description: 'Wise owl with glasses, preppy sweater, thoughtful pose',
    colors: {
      primary: '#7B2CBF',
      secondary: '#FF9E00',
      accent: '#FFD700',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'thinking', 'reading'],
    filePath: 'src/components/mascots/generated/dropout/OwlDropout.tsx',
  },
  {
    id: 'wolf-dropout',
    animal: 'wolf',
    style: 'dropout',
    componentName: 'WolfDropout',
    displayName: 'Wolf (Dropout)',
    description: 'Mysterious midnight wolf with leather jacket, piercing cyan eyes',
    colors: {
      primary: '#4A4A4A',
      secondary: '#2D2D2D',
      accent: '#00B4D8',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'howl', 'prowl', 'celebrate'],
    variants: ['midnight', 'silverback'],
    filePath: 'src/components/mascots/generated/dropout/WolfDropout.tsx',
  },
  {
    id: 'hawk-dropout',
    animal: 'hawk',
    style: 'dropout',
    componentName: 'HawkDropout',
    displayName: 'Hawk (Dropout)',
    description: 'Sharp-eyed hawk with focused gaze, precision pose',
    colors: {
      primary: '#8B4513',
      secondary: '#D2691E',
      accent: '#FFD700',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'alert', 'swoop'],
    filePath: 'src/components/mascots/generated/dropout/HawkDropout.tsx',
  },
  {
    id: 'bear-dropout',
    animal: 'bear',
    style: 'dropout',
    componentName: 'BearDropout',
    displayName: 'Bear (Dropout)',
    description: 'College-themed bear mascot with graduation vibes',
    colors: {
      primary: '#8B4513',
      secondary: '#D2691E',
      accent: '#DC143C',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'wave', 'celebrate', 'none'],
    variants: ['default', 'homecoming', 'graduation', 'late-registration', 'yeezus', 'donda'],
    filePath: 'src/components/mascots/dropout/BearDropout.tsx',
  },
  {
    id: 'bunny-dropout',
    animal: 'bunny',
    style: 'dropout',
    componentName: 'BunnyDropout',
    displayName: 'Bunny (Dropout)',
    description: 'Trendy, fashionable bunny in Dropout style with stylish hoodie',
    colors: {
      primary: '#FF69B4',
      secondary: '#FF1493',
      accent: '#FFB6C1',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'wave', 'celebrate', 'none'],
    filePath: 'src/components/mascots/dropout/BunnyDropout.tsx',
  },
  {
    id: 'cat-dropout',
    animal: 'cat',
    style: 'dropout',
    componentName: 'CatDropout',
    displayName: 'Cat (Dropout)',
    description: 'Playful tuxedo cat wearing a pink bunny onesie',
    colors: {
      primary: '#2D2D2D',
      secondary: '#FF69B4',
      accent: '#00B4D8',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'mischief', 'peekaboo', 'celebrate'],
    variants: ['tuxedo', 'onesie-only'],
    filePath: 'src/components/mascots/generated/dropout/CatDropout.tsx',
  },

  // === NJ STYLE (7 mascots) ===
  {
    id: 'fox-nj',
    animal: 'fox',
    style: 'nj',
    componentName: 'FoxNJ',
    displayName: 'Fox (NJ)',
    description: 'Minimalist line art fox with clever expression',
    colors: {
      primary: '#0000FF',
      secondary: '#0066FF',
      accent: '#00AAFF',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'wave', 'celebrate'],
    variants: ['classic-blue', 'attention', 'hype-boy', 'cookie', 'ditto'],
    filePath: 'src/components/mascots/generated/nj/FoxNJ.tsx',
  },
  {
    id: 'owl-nj',
    animal: 'owl',
    style: 'nj',
    componentName: 'OwlNJ',
    displayName: 'Owl (NJ)',
    description: 'Minimalist owl outline with wise expression',
    colors: {
      primary: '#0000FF',
      secondary: '#0066FF',
      accent: '#00AAFF',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'thinking', 'reading'],
    filePath: 'src/components/mascots/generated/nj/OwlNJ.tsx',
  },
  {
    id: 'wolf-nj',
    animal: 'wolf',
    style: 'nj',
    componentName: 'WolfNJ',
    displayName: 'Wolf (NJ)',
    description: 'Mysterious wolf rendered in minimalist line art',
    colors: {
      primary: '#0000FF',
      secondary: '#0066FF',
      accent: '#00AAFF',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'howl', 'prowl'],
    variants: ['classic-blue', 'attention', 'hype-boy', 'cookie', 'ditto'],
    filePath: 'src/components/mascots/generated/nj/WolfNJ.tsx',
  },
  {
    id: 'hawk-nj',
    animal: 'hawk',
    style: 'nj',
    componentName: 'HawkNJ',
    displayName: 'Hawk (NJ)',
    description: 'Sleek hawk outline with precision lines and sharp angles',
    colors: {
      primary: '#0000FF',
      secondary: '#0066FF',
      accent: '#00AAFF',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'alert', 'scanning'],
    filePath: 'src/components/mascots/generated/nj/HawkNJ.tsx',
  },
  {
    id: 'bear-nj',
    animal: 'bear',
    style: 'nj',
    componentName: 'BearNJ',
    displayName: 'Bear (NJ)',
    description: 'Simple, friendly bear rendered in NJ line art style',
    colors: {
      primary: '#0000FF',
      secondary: '#0066FF',
      accent: '#00AAFF',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'wave', 'celebrate', 'none'],
    filePath: 'src/components/mascots/nj/BearNJ.tsx',
  },
  {
    id: 'bunny-nj',
    animal: 'bunny',
    style: 'nj',
    componentName: 'BunnyNJ',
    displayName: 'Bunny (NJ)',
    description: 'K-pop inspired bunny mascot with iconic floppy ears',
    colors: {
      primary: '#0000FF',
      secondary: '#0066FF',
      accent: '#00AAFF',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'wave', 'celebrate', 'none'],
    variants: ['classic-blue', 'attention', 'hype-boy', 'cookie', 'ditto'],
    filePath: 'src/components/mascots/nj/BunnyNJ.tsx',
  },
  {
    id: 'cat-nj',
    animal: 'cat',
    style: 'nj',
    componentName: 'CatNJ',
    displayName: 'Cat (NJ)',
    description: 'Playful cat outline in minimalist NJ style',
    colors: {
      primary: '#0000FF',
      secondary: '#0066FF',
      accent: '#00AAFF',
    },
    sizes: [32, 64, 128, 256, 512],
    animations: ['idle', 'mischief', 'peekaboo'],
    variants: ['classic-blue', 'attention', 'hype-boy', 'cookie', 'ditto'],
    filePath: 'src/components/mascots/generated/nj/CatNJ.tsx',
  },
];

// ===== UTILITY FUNCTIONS =====

/**
 * Get all mascots for a specific style
 */
export function getMascotsByStyle(style: MascotStyle): MascotConfig[] {
  return MASCOT_CONFIGS.filter(config => config.style === style);
}

/**
 * Get all mascots for a specific animal
 */
export function getMascotsByAnimal(animal: MascotAnimal): MascotConfig[] {
  return MASCOT_CONFIGS.filter(config => config.animal === animal);
}

/**
 * Get a specific mascot by ID
 */
export function getMascotById(id: string): MascotConfig | undefined {
  return MASCOT_CONFIGS.find(config => config.id === id);
}

/**
 * Get mascot by animal and style
 */
export function getMascot(animal: MascotAnimal, style: MascotStyle): MascotConfig | undefined {
  return MASCOT_CONFIGS.find(config => config.animal === animal && config.style === style);
}

/**
 * Get all available animals
 */
export function getAnimals(): MascotAnimal[] {
  return [...MASCOT_ANIMALS];
}

/**
 * Get all available styles
 */
export function getStyles(): MascotStyle[] {
  return [...MASCOT_STYLES];
}

/**
 * Generate import statement for a mascot component
 */
export function generateImport(config: MascotConfig): string {
  const relativePath = config.filePath.replace('src/', '@/');
  return `import { ${config.componentName} } from '${relativePath}';`;
}

/**
 * Get default variant for a mascot
 */
export function getDefaultVariant(config: MascotConfig): string | undefined {
  return config.variants?.[0];
}

/**
 * Check if a mascot has variants
 */
export function hasVariants(config: MascotConfig): boolean {
  return !!config.variants && config.variants.length > 0;
}

export default MASCOT_CONFIGS;
