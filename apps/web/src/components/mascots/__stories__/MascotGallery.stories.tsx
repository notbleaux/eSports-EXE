// @ts-nocheck
/** [Ver001.000]
 * MascotGallery Stories
 * =====================
 * Storybook stories for the MascotGallery component.
 * Demonstrates filtering, sorting, search, and view modes.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MascotGallery } from '../MascotGallery';
import { MOCK_MASCOTS } from '../mocks/mascots';
import type { MascotId } from '../types';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof MascotGallery> = {
  title: 'Mascots/MascotGallery',
  component: MascotGallery,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
MascotGallery provides a complete gallery view with filtering, sorting, and search.

## Features
- Responsive grid layout
- Element filter (Solar, Lunar, Binary, Fire, Magic)
- Rarity filter (Common, Rare, Epic, Legendary)
- Search by name or ability
- Sort by name, rarity, power, element, release date
- Grid and list view modes
- Empty state handling
- Loading skeletons

## Usage
\`\`\`tsx
import { MascotGallery } from '@/components/mascots';

<MascotGallery
  mascots={mascotData}
  favorites={['sol', 'lun']}
  onMascotSelect={(mascot) => setSelectedMascot(mascot)}
/>
\`\``
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mascots: {
      description: 'Array of mascot data',
      control: 'object',
    },
    favorites: {
      description: 'Array of favorite mascot IDs',
      control: 'object',
    },
    loading: {
      description: 'Show loading state',
      control: 'boolean',
    },
    onMascotSelect: {
      description: 'Selection handler',
      action: 'mascot selected',
    },
    onMascotFavorite: {
      description: 'Favorite toggle handler',
      action: 'favorite toggled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MascotGallery>;

// ============================================================================
// Stories
// ============================================================================

// Default gallery
export const Default: Story = {
  args: {
    mascots: MOCK_MASCOTS,
    favorites: ['sol'],
  },
};

// Loading state
export const Loading: Story = {
  args: {
    mascots: [],
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state displays skeleton placeholders while data is fetched.',
      },
    },
  },
};

// Empty state
export const Empty: Story = {
  args: {
    mascots: [],
    emptyStateMessage: 'No mascots found. Start your collection today!',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state displays when no mascots match the filters.',
      },
    },
  },
};

// Many mascots (virtual scrolling demo)
export const ManyMascots: Story = {
  args: {
    mascots: Array.from({ length: 20 }, (_, i) => ({
      ...MOCK_MASCOTS[i % MOCK_MASCOTS.length],
      id: `mascot-${i}`,
      displayName: `${MOCK_MASCOTS[i % MOCK_MASCOTS.length].displayName} ${i + 1}`,
    })),
  },
  parameters: {
    docs: {
      description: {
        story: 'Gallery supports large collections with virtual scrolling for performance.',
      },
    },
  },
};

// Interactive with state
export const Interactive: Story = {
  render: () => {
    const [favorites, setFavorites] = useState<MascotId[]>(['sol']);
    const [selectedMascot, setSelectedMascot] = useState<string | null>(null);

    const handleFavorite = (mascot: typeof MOCK_MASCOTS[0]) => {
      setFavorites(prev => 
        prev.includes(mascot.id)
          ? prev.filter(id => id !== mascot.id)
          : [...prev, mascot.id]
      );
    };

    return (
      <div className="space-y-4">
        {selectedMascot && (
          <div className="p-4 bg-cyan-50 rounded-xl">
            <p className="text-cyan-800">
              Selected: <strong>{selectedMascot}</strong>
            </p>
          </div>
        )}
        <MascotGallery
          mascots={MOCK_MASCOTS}
          favorites={favorites}
          onMascotSelect={(mascot) => setSelectedMascot(mascot.displayName)}
          onMascotFavorite={handleFavorite}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo with state management for favorites and selection.',
      },
    },
  },
};

// Pre-filtered
export const PreFiltered: Story = {
  args: {
    mascots: MOCK_MASCOTS,
    filter: {
      elements: ['solar', 'fire'],
      sortBy: 'rarity',
      sortDirection: 'desc',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Gallery can be initialized with pre-applied filters.',
      },
    },
  },
};

// Custom card size
export const SmallCards: Story = {
  args: {
    mascots: MOCK_MASCOTS,
    config: {
      cardSize: 'sm',
      columns: { sm: 2, md: 3, lg: 4, xl: 5 },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Small card size allows more items per row.',
      },
    },
  },
};

// Large cards
export const LargeCards: Story = {
  args: {
    mascots: MOCK_MASCOTS,
    config: {
      cardSize: 'lg',
      columns: { sm: 1, md: 2, lg: 2, xl: 3 },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Large card size for detailed previews.',
      },
    },
  },
};

// No animations
export const NoAnimations: Story = {
  args: {
    mascots: MOCK_MASCOTS,
    config: {
      animateEntrance: false,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Animations can be disabled for users with reduced motion preferences.',
      },
    },
  },
};
