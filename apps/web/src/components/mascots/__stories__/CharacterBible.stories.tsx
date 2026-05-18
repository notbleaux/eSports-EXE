// @ts-nocheck
/** [Ver001.000]
 * CharacterBible Stories
 * ======================
 * Storybook stories for the CharacterBible component.
 * Demonstrates detailed mascot view with lore and stats.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CharacterBible } from '../CharacterBible';
import { MascotCard } from '../MascotCard';
import { MOCK_MASCOTS } from '../mocks/mascots';
import type { Mascot } from '../types';

// ============================================================================
// Meta Configuration
// ============================================================================

const meta: Meta<typeof CharacterBible> = {
  title: 'Mascots/CharacterBible',
  component: CharacterBible,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
CharacterBible displays detailed mascot information in a modal/drawer.

## Features
- Full mascot profile with avatar
- Stats radar chart (Recharts)
- Complete backstory and lore
- Ability descriptions with cooldowns
- Related mascots section
- Keyboard accessible (ESC to close)
- Reduced motion support

## Usage
\`\`\`tsx
import { CharacterBible } from '@/components/mascots';

<CharacterBible
  mascot={selectedMascot}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
/>
\`\``
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mascot: {
      description: 'Mascot data to display',
      control: 'object',
    },
    isOpen: {
      description: 'Whether the bible is visible',
      control: 'boolean',
    },
    onClose: {
      description: 'Close handler',
      action: 'closed',
    },
    relatedMascots: {
      description: 'Override related mascots',
      control: 'object',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CharacterBible>;

// ============================================================================
// Stories
// ============================================================================

// Sol - Legendary Solar Phoenix
export const SolLegendary: Story = {
  args: {
    mascot: MOCK_MASCOTS[0],
    isOpen: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Sol - The Solar Phoenix (Legendary, Solar element). Born from a dying star with powers of rebirth.',
      },
    },
  },
};

// Lun - Epic Lunar Owl
export const LunEpic: Story = {
  args: {
    mascot: MOCK_MASCOTS[1],
    isOpen: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Lun - The Lunar Owl (Epic, Lunar element). Guardian of the Moon Temple with ancient wisdom.',
      },
    },
  },
};

// Bin - Rare Binary Cyber
export const BinRare: Story = {
  args: {
    mascot: MOCK_MASCOTS[2],
    isOpen: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Bin - The Binary Cyber (Rare, Binary element). AI entity from the cyber realm.',
      },
    },
  },
};

// Fat - Epic Fire
export const FatEpic: Story = {
  args: {
    mascot: MOCK_MASCOTS[3],
    isOpen: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fat - The Fire Spirit (Epic, Fire element). Primordial flame from volcanic core.',
      },
    },
  },
};

// Uni - Legendary Magic
export const UniLegendary: Story = {
  args: {
    mascot: MOCK_MASCOTS[4],
    isOpen: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Uni - The Starlight Unicorn (Legendary, Magic element). Last of the mythical Starlight Unicorns.',
      },
    },
  },
};

// Closed state
export const Closed: Story = {
  args: {
    mascot: MOCK_MASCOTS[0],
    isOpen: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When isOpen is false, the bible is not rendered.',
      },
    },
  },
};

// With related mascots
export const WithRelatedMascots: Story = {
  args: {
    mascot: MOCK_MASCOTS[0],
    isOpen: true,
    relatedMascots: [MOCK_MASCOTS[3], MOCK_MASCOTS[1]],
  },
  parameters: {
    docs: {
      description: {
        story: 'Related mascots section shows connections between characters.',
      },
    },
  },
};

// Interactive demo
export const Interactive: Story = {
  render: () => {
    const [selectedMascot, setSelectedMascot] = useState<Mascot | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleMascotClick = (mascot: Mascot) => {
      setSelectedMascot(mascot);
      setIsOpen(true);
    };

    const handleRelatedClick = (mascot: Mascot) => {
      setSelectedMascot(mascot);
    };

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Click a mascot to view details</h3>
          <p className="text-sm text-gray-500">Opens CharacterBible modal</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
          {MOCK_MASCOTS.map((mascot) => (
            <MascotCard
              key={mascot.id}
              mascot={mascot}
              onClick={handleMascotClick}
            />
          ))}
        </div>

        <CharacterBible
          mascot={selectedMascot}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onRelatedMascotClick={handleRelatedClick}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing CharacterBible integration with MascotCard.',
      },
    },
  },
};

// All mascots cycle
export const AllMascots: Story = {
  render: () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentMascot = MOCK_MASCOTS[currentIndex];

    return (
      <div className="space-y-4">
        <div className="flex justify-center gap-2">
          {MOCK_MASCOTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition-colors ${
                i === currentIndex ? 'bg-cyan-500' : 'bg-gray-300'
              }`}
              aria-label={`View ${MOCK_MASCOTS[i].displayName}`}
            />
          ))}
        </div>
        <CharacterBible
          mascot={currentMascot}
          isOpen={true}
          onClose={() => {}}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Cycle through all mascot profiles to compare stats and lore.',
      },
    },
  },
};
