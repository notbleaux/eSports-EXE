/** [Ver001.000]
 * MascotCard Stories
 * ==================
 * Storybook stories for the MascotCard component.
 * Demonstrates all variants, sizes, and interactive states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MascotCard } from '../MascotCard';
import { MOCK_MASCOTS } from '../mocks/mascots';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof MascotCard> = {
  title: 'Mascots/MascotCard',
  component: MascotCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
MascotCard displays a mascot character with avatar, stats, and rarity indicator.

## Features
- Three sizes: sm, md, lg
- Rarity-based glow effects
- Hover animations with Framer Motion
- Click-to-expand support
- Favorite toggle functionality
- WCAG 2.1 AA accessible

## Usage
\`\`\`tsx
import { MascotCard } from '@/components/mascots';

<MascotCard
  mascot={mascotData}
  size="md"
  onClick={(mascot) => console.log('Clicked:', mascot)}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mascot: {
      description: 'Mascot data object',
      control: 'object',
    },
    size: {
      description: 'Card size variant',
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    isSelected: {
      description: 'Whether the card is selected',
      control: 'boolean',
    },
    isFavorite: {
      description: 'Whether the mascot is favorited',
      control: 'boolean',
    },
    isLocked: {
      description: 'Whether the mascot is locked/unavailable',
      control: 'boolean',
    },
    showStats: {
      description: 'Show stats preview',
      control: 'boolean',
    },
    showRarity: {
      description: 'Show rarity stars',
      control: 'boolean',
    },
    animated: {
      description: 'Enable animations',
      control: 'boolean',
    },
    onClick: {
      description: 'Click handler',
      action: 'clicked',
    },
    onFavoriteToggle: {
      description: 'Favorite toggle handler',
      action: 'favorite toggled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MascotCard>;

// ============================================================================
// Stories
// ============================================================================

// Default story with Sol mascot
export const Default: Story = {
  args: {
    mascot: MOCK_MASCOTS[0], // Sol
    size: 'md',
    showStats: true,
    showRarity: true,
    animated: true,
  },
};

// All Sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-start gap-6">
      <MascotCard mascot={MOCK_MASCOTS[0]} size="sm" />
      <MascotCard mascot={MOCK_MASCOTS[0]} size="md" />
      <MascotCard mascot={MOCK_MASCOTS[0]} size="lg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'MascotCard supports three sizes: sm (160px), md (224px), and lg (288px) width.',
      },
    },
  },
};

// All Rarities
export const AllRarities: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {/* Common - Would need a common mascot in mock data */}
      <MascotCard 
        mascot={{ ...MOCK_MASCOTS[2], rarity: 'common', displayName: 'Common' }} 
        size="md" 
      />
      {/* Rare */}
      <MascotCard mascot={MOCK_MASCOTS[2]} size="md" />
      {/* Epic */}
      <MascotCard mascot={MOCK_MASCOTS[1]} size="md" />
      {/* Legendary */}
      <MascotCard mascot={MOCK_MASCOTS[0]} size="md" />
      {/* Another Legendary */}
      <MascotCard mascot={MOCK_MASCOTS[4]} size="md" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Each rarity level (Common, Rare, Epic, Legendary) has distinct visual styling including star count and glow intensity.',
      },
    },
  },
};

// All Elements
export const AllElements: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {MOCK_MASCOTS.map((mascot) => (
        <MascotCard key={mascot.id} mascot={mascot} size="md" />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Five element types: Solar (Sol), Lunar (Lun), Binary (Bin), Fire (Fat), and Magic (Uni). Each has unique colors and icons.',
      },
    },
  },
};

// Selected State
export const Selected: Story = {
  args: {
    mascot: MOCK_MASCOTS[0],
    size: 'md',
    isSelected: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Selected state shows a colored border and ring effect matching the mascot\'s theme color.',
      },
    },
  },
};

// Favorite State
export const Favorite: Story = {
  args: {
    mascot: MOCK_MASCOTS[0],
    size: 'md',
    isFavorite: true,
    onFavoriteToggle: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Favorite state displays a filled heart icon. Clicking toggles the favorite status.',
      },
    },
  },
};

// Locked State
export const Locked: Story = {
  args: {
    mascot: MOCK_MASCOTS[0],
    size: 'md',
    isLocked: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Locked mascots show a lock overlay and cannot be clicked or favorited.',
      },
    },
  },
};

// No Stats
export const NoStats: Story = {
  args: {
    mascot: MOCK_MASCOTS[0],
    size: 'md',
    showStats: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Stats can be hidden for a more compact display.',
      },
    },
  },
};

// No Rarity Badge
export const NoRarity: Story = {
  args: {
    mascot: MOCK_MASCOTS[0],
    size: 'md',
    showRarity: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Rarity badge can be hidden.',
      },
    },
  },
};

// Interactive Playground
export const Playground: Story = {
  args: {
    mascot: MOCK_MASCOTS[0],
    size: 'md',
    isSelected: false,
    isFavorite: false,
    isLocked: false,
    showStats: true,
    showRarity: true,
    animated: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground for testing all props.',
      },
    },
  },
};

// Accessibility Test
export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Use screen reader to verify ARIA labels and keyboard navigation.
      </p>
      <div className="flex gap-6">
        <MascotCard 
          mascot={MOCK_MASCOTS[0]} 
          size="md" 
          onClick={() => alert('Sol clicked!')}
          onFavoriteToggle={() => alert('Favorite toggled!')}
        />
        <MascotCard 
          mascot={MOCK_MASCOTS[1]} 
          size="md"
          isLocked
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Test accessibility features: keyboard navigation, ARIA labels, and screen reader announcements.',
      },
    },
  },
};
