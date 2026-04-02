// @ts-nocheck
/** [Ver001.000]
 * Mascots Stories
 * ==============
 * Storybook stories for all mascot components.
 * Demonstrates all 14 mascots (7 animals × 2 styles) with various configurations.
 * 
 * Stories Included:
 * - All Mascots Overview: Grid view of all 14 mascot variations
 * - Style Comparison: Side-by-side Dropout vs NJ style
 * - Size Scale: All available sizes from 32px to 512px
 * - Animation Showcase: Available animations per mascot
 * - Variant Gallery: Style-specific variants (Bear albums, etc.)
 * - Interactive Playground: Full control via Storybook controls
 * - Cat in Onesie: Special feature showcase
 * - Style Toggle Demo: Interactive style switching
 * - Dark Mode: All mascots in dark theme
 * - Loading States: Suspense fallback demonstration
 * - Error States: Fallback rendering
 * - Accessibility: ARIA labels and keyboard navigation
 * - Performance Test: 50 mascots rendering test
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { 
  MascotAssetEnhanced,
  MascotStyleToggle,
  MASCOT_ANIMALS,
  MASCOT_STYLES,
  ALL_MASCOT_ANIMALS,
  ALL_MASCOT_STYLES,
  getAnimalDisplayName,
  getStyleDisplayName,
  getAnimalEmoji,
} from '../MascotAssetEnhanced';
import type { 
  MascotAnimal, 
  MascotStyle, 
  MascotSize, 
  MascotAnimation 
} from '../MascotAssetEnhanced';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof MascotAssetEnhanced> = {
  title: 'Mascots/All Mascots',
  component: MascotAssetEnhanced,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Complete showcase of all 14 mascots (7 animals × 2 styles).

## Animals
- 🦊 Fox - Street-smart with bomber jacket
- 🦉 Owl - Wise with glasses and sweater
- 🐺 Wolf - Mysterious midnight wolf
- 🦅 Hawk - Sharp-eyed precision
- 🐻 Bear - College-themed mascot
- 🐰 Bunny - K-pop inspired
- 🐱 Cat - Playful tuxedo cat

## Styles
- **Dropout**: Full-color cartoon with rich gradients
- **NJ**: Minimalist line art with electric blue strokes

## Features
- 5 sizes: 32px, 64px, 128px, 256px, 512px
- Multiple animations per mascot
- Style-specific variants
- Accessibility support
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    animal: {
      description: 'Mascot animal type',
      control: 'select',
      options: MASCOT_ANIMALS,
    },
    style: {
      description: 'Visual style variant',
      control: 'radio',
      options: MASCOT_STYLES,
    },
    size: {
      description: 'Size in pixels',
      control: 'select',
      options: [32, 64, 128, 256, 512],
    },
    animation: {
      description: 'Animation state',
      control: 'select',
      options: ['idle', 'wave', 'celebrate', 'confident', 'thinking', 'reading', 'howl', 'prowl', 'mischief', 'peekaboo', 'alert', 'scanning', 'none'],
    },
    variant: {
      description: 'Style-specific variant',
      control: 'text',
    },
    hoverable: {
      description: 'Enable hover effects',
      control: 'boolean',
    },
    showGlint: {
      description: 'Show glasses glint (Dropout Owl only)',
      control: 'boolean',
    },
    strokeColor: {
      description: 'Custom stroke color (NJ style only)',
      control: 'color',
    },
    alt: {
      description: 'Alt text for accessibility',
      control: 'text',
    },
    onClick: {
      description: 'Click handler',
      action: 'clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MascotAssetEnhanced>;

// ============================================================================
// Story 1: All Mascots Overview
// ============================================================================

export const AllMascots: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Dropout Style</h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
          {MASCOT_ANIMALS.map(animal => (
            <div key={animal} className="flex flex-col items-center gap-2">
              <MascotAssetEnhanced animal={animal} style="dropout" size={128} />
              <span className="text-sm text-gray-600 capitalize">{animal}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">NJ Style</h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
          {MASCOT_ANIMALS.map(animal => (
            <div key={animal} className="flex flex-col items-center gap-2">
              <MascotAssetEnhanced animal={animal} style="nj" size={128} />
              <span className="text-sm text-gray-600 capitalize">{animal}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete overview of all 14 mascots (7 animals × 2 styles).',
      },
    },
  },
};

// ============================================================================
// Story 2: Style Comparison
// ============================================================================

export const StyleComparison: Story = {
  render: () => (
    <div className="space-y-8">
      {MASCOT_ANIMALS.map(animal => (
        <div key={animal} className="flex items-center gap-8 p-4 bg-gray-50 rounded-lg">
          <div className="w-20 font-semibold capitalize text-gray-700">{animal}</div>
          <div className="flex gap-8">
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-orange-600 font-medium">Dropout</span>
              <MascotAssetEnhanced animal={animal} style="dropout" size={128} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-blue-600 font-medium">NJ</span>
              <MascotAssetEnhanced animal={animal} style="nj" size={128} />
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of Dropout vs NJ styles for each animal.',
      },
    },
  },
};

// ============================================================================
// Story 3: Size Scale
// ============================================================================

export const SizeScale: Story = {
  render: () => (
    <div className="space-y-8">
      {MASCOT_ANIMALS.map(animal => (
        <div key={animal} className="flex items-end gap-4 p-4 bg-gray-50 rounded-lg overflow-x-auto">
          <div className="w-20 font-semibold capitalize text-gray-700 self-center">{animal}</div>
          {[32, 64, 128, 256, 512].map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <MascotAssetEnhanced animal={animal} style="dropout" size={size as MascotSize} />
              <span className="text-xs text-gray-500">{size}px</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available sizes from 32px to 512px for each mascot.',
      },
    },
  },
};

// ============================================================================
// Story 4: Animation Showcase
// ============================================================================

const ANIMATIONS_BY_ANIMAL: Record<MascotAnimal, string[]> = {
  fox: ['idle', 'wave', 'celebrate', 'confident'],
  owl: ['idle', 'thinking', 'reading'],
  wolf: ['idle', 'howl', 'prowl', 'celebrate'],
  hawk: ['idle', 'alert', 'scanning'],
  bear: ['idle', 'wave', 'celebrate'],
  bunny: ['idle', 'wave', 'celebrate'],
  cat: ['idle', 'mischief', 'peekaboo', 'celebrate'],
};

export const Animations: Story = {
  render: () => (
    <div className="space-y-8">
      {MASCOT_ANIMALS.map(animal => (
        <div key={animal} className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold capitalize mb-4 text-gray-700">{animal}</h4>
          <div className="flex flex-wrap gap-6">
            {ANIMATIONS_BY_ANIMAL[animal].map(animation => (
              <div key={animation} className="flex flex-col items-center gap-2">
                <span className="text-xs text-gray-500 capitalize">{animation}</span>
                <MascotAssetEnhanced 
                  animal={animal}
                  style="dropout"
                  animation={animation as MascotAnimation}
                  size={128}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available animations for each mascot animal.',
      },
    },
  },
};

// ============================================================================
// Story 5: Variant Gallery
// ============================================================================

const BEAR_VARIANTS = ['default', 'homecoming', 'graduation', 'late-registration', 'yeezus', 'donda'];
const FOX_VARIANTS = ['classic-blue', 'attention', 'hype-boy', 'cookie', 'ditto'];
const WOLF_VARIANTS = ['midnight', 'silverback'];
const CAT_VARIANTS = ['tuxedo', 'onesie-only'];
const BUNNY_VARIANTS = ['classic-blue', 'attention', 'hype-boy', 'cookie', 'ditto'];

export const BearVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h4 className="font-semibold mb-4 text-gray-700">Dropout Style - Album Variants</h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {BEAR_VARIANTS.map(variant => (
            <div key={variant} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500 capitalize">{variant.replace('-', ' ')}</span>
              <MascotAssetEnhanced 
                animal="bear"
                style="dropout"
                variant={variant}
                size={128}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Bear mascot album-inspired variants (Dropout style).',
      },
    },
  },
};

export const FoxVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h4 className="font-semibold mb-4 text-gray-700">NJ Style - Song Variants</h4>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {FOX_VARIANTS.map(variant => (
            <div key={variant} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500 capitalize">{variant.replace('-', ' ')}</span>
              <MascotAssetEnhanced 
                animal="fox"
                style="nj"
                variant={variant}
                size={128}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Fox mascot song-inspired variants (NJ style).',
      },
    },
  },
};

export const WolfVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {WOLF_VARIANTS.map(variant => (
        <div key={variant} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600 capitalize">{variant}</span>
          <MascotAssetEnhanced 
            animal="wolf"
            style="dropout"
            variant={variant}
            size={128}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Wolf mascot variants in Dropout style.',
      },
    },
  },
};

export const CatVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {CAT_VARIANTS.map(variant => (
        <div key={variant} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600 capitalize">{variant.replace('-', ' ')}</span>
          <MascotAssetEnhanced 
            animal="cat"
            style="dropout"
            variant={variant}
            size={128}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Cat mascot variants in Dropout style.',
      },
    },
  },
};

// ============================================================================
// Story 6: Interactive Playground
// ============================================================================

export const Playground: Story = {
  args: {
    animal: 'fox',
    style: 'dropout',
    size: 128,
    variant: undefined,
    animation: 'idle',
    hoverable: true,
    showGlint: true,
    alt: 'Fox mascot',
  },
  argTypes: {
    animal: { control: 'select', options: ALL_MASCOT_ANIMALS },
    style: { control: 'radio', options: ALL_MASCOT_STYLES },
    size: { control: 'select', options: [32, 64, 128, 256, 512] },
    animation: { 
      control: 'select', 
      options: ['idle', 'wave', 'celebrate', 'confident', 'thinking', 'reading', 'howl', 'prowl', 'mischief', 'peekaboo', 'alert', 'scanning', 'none']
    },
    variant: { 
      control: 'select', 
      options: ['default', 'homecoming', 'graduation', 'late-registration', 'yeezus', 'donda', 'classic-blue', 'attention', 'hype-boy', 'cookie', 'ditto', 'midnight', 'silverback', 'tuxedo', 'onesie-only']
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground with full control over all props.',
      },
    },
  },
};

// ============================================================================
// Story 7: Special - Cat in Onesie
// ============================================================================

export const CatInOnesie: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-8 items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl">
          <h4 className="font-semibold text-gray-700">Dropout Style</h4>
          <MascotAssetEnhanced 
            animal="cat" 
            style="dropout"
            variant="tuxedo"
            size={256}
            animation="mischief"
          />
          <p className="text-sm text-gray-500">Tuxedo variant with mischief animation</p>
        </div>
        <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
          <h4 className="font-semibold text-gray-700">NJ Style</h4>
          <MascotAssetEnhanced 
            animal="cat" 
            style="nj"
            size={256}
            animation="idle"
          />
          <p className="text-sm text-gray-500">Classic line art style</p>
        </div>
      </div>
      <div className="flex justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <h4 className="font-semibold text-gray-700">Small Size</h4>
          <MascotAssetEnhanced 
            animal="cat" 
            style="dropout"
            variant="tuxedo"
            size={64}
            animation="peekaboo"
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h4 className="font-semibold text-gray-700">Large Size</h4>
          <MascotAssetEnhanced 
            animal="cat" 
            style="dropout"
            variant="tuxedo"
            size={512}
            animation="celebrate"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Special showcase of the cat mascot in onesie - a fan favorite!',
      },
    },
  },
};

// ============================================================================
// Story 8: Style Toggle Demo
// ============================================================================

export const StyleToggleDemo: Story = {
  render: () => {
    const [style, setStyle] = useState<MascotStyle>('dropout');
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-semibold text-gray-700">Style Toggle</h4>
            <p className="text-sm text-gray-500">Click to switch between Dropout and NJ styles</p>
          </div>
          <MascotStyleToggle value={style} onChange={setStyle} />
        </div>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
          {ALL_MASCOT_ANIMALS.map(animal => (
            <div key={animal} className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
              <MascotAssetEnhanced 
                animal={animal}
                style={style}
                size={128}
              />
              <span className="text-xs text-gray-500 capitalize">{animal}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo of style switching with MascotStyleToggle component.',
      },
    },
  },
};

// ============================================================================
// Story 9: Dark Mode
// ============================================================================

export const DarkMode: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-6 bg-gray-900 rounded-xl">
        <h4 className="font-semibold mb-4 text-white">Dark Mode - Dropout Style</h4>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
          {MASCOT_ANIMALS.map(animal => (
            <div key={animal} className="flex flex-col items-center gap-2">
              <MascotAssetEnhanced animal={animal} style="dropout" size={128} />
              <span className="text-xs text-gray-400 capitalize">{animal}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 bg-gray-900 rounded-xl">
        <h4 className="font-semibold mb-4 text-white">Dark Mode - NJ Style</h4>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
          {MASCOT_ANIMALS.map(animal => (
            <div key={animal} className="flex flex-col items-center gap-2">
              <MascotAssetEnhanced animal={animal} style="nj" size={128} />
              <span className="text-xs text-gray-400 capitalize">{animal}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All mascots displayed on dark backgrounds.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
};

// ============================================================================
// Story 10: Loading States
// ============================================================================

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-4 text-gray-700">Loading Animation</h4>
        <p className="text-sm text-gray-500 mb-4">
          The component shows a loading spinner while the mascot asset is being lazy-loaded.
        </p>
        <div className="flex gap-4">
          {[32, 64, 128, 256].map(size => (
            <div 
              key={size} 
              className="flex flex-col items-center gap-2"
              style={{ 
                width: size, 
                height: size, 
                background: 'rgba(0,0,0,0.05)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div 
                style={{
                  width: size * 0.3,
                  height: size * 0.3,
                  border: '3px solid rgba(0, 0, 255, 0.1)',
                  borderTopColor: '#0000FF',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span className="text-xs text-gray-400">{size}px</span>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state demonstration with spinner animation.',
      },
    },
  },
};

// ============================================================================
// Story 11: Error States
// ============================================================================

export const ErrorStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-4 text-gray-700">Error Fallback</h4>
        <p className="text-sm text-gray-500 mb-4">
          When a mascot fails to load, the component shows an error fallback with the mascot emoji.
        </p>
        <div className="flex gap-4">
          {ALL_MASCOT_ANIMALS.map(animal => (
            <div 
              key={animal}
              className="flex flex-col items-center gap-2"
            >
              <div 
                style={{
                  width: 128,
                  height: 128,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  borderRadius: 8,
                  fontSize: 48,
                }}
              >
                {getAnimalEmoji(animal)}
              </div>
              <span className="text-xs text-gray-500 capitalize">{animal}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state demonstration showing fallback emojis.',
      },
    },
  },
};

// ============================================================================
// Story 12: Accessibility
// ============================================================================

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-2 text-blue-800">ARIA Labels</h4>
        <p className="text-sm text-blue-600 mb-4">
          All mascots include proper ARIA labels for screen readers. Use your screen reader to verify.
        </p>
        <div className="flex gap-4">
          <MascotAssetEnhanced animal="fox" style="dropout" size={128} alt="Fox mascot - Dropout style" />
          <MascotAssetEnhanced animal="owl" style="nj" size={128} alt="Owl mascot - NJ style" />
          <MascotAssetEnhanced animal="bear" style="dropout" size={128} alt="Bear mascot - Dropout style" />
        </div>
      </div>
      
      <div className="p-4 bg-green-50 rounded-lg">
        <h4 className="font-semibold mb-2 text-green-800">Keyboard Navigation</h4>
        <p className="text-sm text-green-600 mb-4">
          Mascots support keyboard focus and activation. Tab to focus, Enter or Space to activate.
        </p>
        <div className="flex gap-4">
          <button className="p-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
            <MascotAssetEnhanced animal="bunny" style="dropout" size={128} />
          </button>
          <button className="p-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
            <MascotAssetEnhanced animal="cat" style="nj" size={128} />
          </button>
          <button className="p-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
            <MascotAssetEnhanced animal="wolf" style="dropout" size={128} />
          </button>
        </div>
      </div>
      
      <div className="p-4 bg-purple-50 rounded-lg">
        <h4 className="font-semibold mb-2 text-purple-800">High Contrast</h4>
        <p className="text-sm text-purple-600 mb-4">
          NJ style provides high contrast for better visibility.
        </p>
        <div className="flex gap-4 p-4 bg-white border-2 border-black">
          {ALL_MASCOT_ANIMALS.map(animal => (
            <MascotAssetEnhanced key={animal} animal={animal} style="nj" size={64} />
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features including ARIA labels, keyboard navigation, and high contrast.',
      },
    },
  },
};

// ============================================================================
// Story 13: Performance Test
// ============================================================================

export const PerformanceTest: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2 text-gray-700">50 Mascots Performance Test</h4>
        <p className="text-sm text-gray-500 mb-4">
          Rendering 50 mascot instances to test performance. All mascots use lazy loading with Suspense.
        </p>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {Array.from({ length: 50 }, (_, i) => {
            const animal = ALL_MASCOT_ANIMALS[i % ALL_MASCOT_ANIMALS.length];
            const style = i % 2 === 0 ? 'dropout' : 'nj';
            return (
              <div key={i} className="flex justify-center">
                <MascotAssetEnhanced 
                  animal={animal} 
                  style={style} 
                  size={64}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Performance stress test with 50 mascot instances.',
      },
    },
  },
};

// ============================================================================
// Story 14: All Animations
// ============================================================================

export const AllAnimations: Story = {
  render: () => {
    const allAnimations: MascotAnimation[] = [
      'idle', 'wave', 'celebrate', 'confident', 
      'thinking', 'reading', 'howl', 'prowl', 
      'mischief', 'peekaboo', 'alert', 'scanning'
    ];
    
    return (
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-4 text-gray-700">All Available Animations</h4>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allAnimations.map(animation => (
              <div key={animation} className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
                <span className="text-xs text-gray-500 capitalize">{animation}</span>
                <MascotAssetEnhanced 
                  animal="fox"
                  style="dropout"
                  animation={animation}
                  size={96}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Gallery of all available mascot animations.',
      },
    },
  },
};

// ============================================================================
// Story 15: Hover Effects
// ============================================================================

export const HoverEffects: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-4 text-gray-700">Hover Effects Enabled</h4>
        <div className="flex gap-4">
          {ALL_MASCOT_ANIMALS.map(animal => (
            <div key={animal} className="flex flex-col items-center gap-2">
              <MascotAssetEnhanced 
                animal={animal} 
                style="dropout" 
                size={128}
                hoverable={true}
              />
              <span className="text-xs text-gray-500 capitalize">{animal}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-4 text-gray-700">Hover Effects Disabled</h4>
        <div className="flex gap-4">
          {ALL_MASCOT_ANIMALS.map(animal => (
            <div key={animal} className="flex flex-col items-center gap-2">
              <MascotAssetEnhanced 
                animal={animal} 
                style="nj" 
                size={128}
                hoverable={false}
              />
              <span className="text-xs text-gray-500 capitalize">{animal}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of hover effects enabled vs disabled.',
      },
    },
  },
};

// ============================================================================
// Story 16: Size Comparison Matrix
// ============================================================================

export const SizeComparisonMatrix: Story = {
  render: () => {
    const sizes: MascotSize[] = [32, 64, 128, 256];
    const animals: MascotAnimal[] = ['fox', 'owl', 'bear', 'cat'];
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b">Animal</th>
              {sizes.map(size => (
                <th key={size} className="p-3 text-center text-sm font-semibold text-gray-700 border-b">
                  {size}px
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {animals.map(animal => (
              <tr key={animal} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <span className="capitalize font-medium">{animal}</span>
                </td>
                {sizes.map(size => (
                  <td key={size} className="p-3 text-center">
                    <MascotAssetEnhanced 
                      animal={animal} 
                      style="dropout" 
                      size={size}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Matrix comparing all sizes for selected mascots.',
      },
    },
  },
};
