import type { Meta, StoryObj } from '@storybook/react';
import { FeatureFlagProvider, FeatureFlagDebugPanel, useFeatureFlagContext } from './FeatureFlagProvider';

/**
 * FeatureFlagProvider provides runtime feature toggling capabilities
 * with a debug panel for development.
 */
const meta: Meta<typeof FeatureFlagProvider> = {
  title: 'Components/Common/FeatureFlagProvider',
  component: FeatureFlagProvider,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Feature flag provider with debug panel for development.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Demo component that shows feature states
const FeatureDemo = () => {
  const { isEnabled } = useFeatureFlagContext();
  
  const features = [
    'opera.live-chat',
    'opera.real-time-events',
    'sator.advanced-analytics',
    'rotas.simulation-3d',
    'tenet.dark-mode',
  ] as const;
  
  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Feature Flags Demo</h1>
      <div className="space-y-4 max-w-md">
        {features.map((feature) => (
          <div
            key={feature}
            className={`p-4 rounded-lg border ${
              isEnabled(feature)
                ? 'bg-green-900/30 border-green-500/50'
                : 'bg-red-900/30 border-red-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{feature}</span>
              <span
                className={`px-2 py-1 rounded text-sm ${
                  isEnabled(feature)
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {isEnabled(feature) ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-gray-400 text-sm">
        Click the 🚩 Features button in the bottom right to toggle features.
      </p>
    </div>
  );
};

/**
 * Default feature flag provider with debug panel
 */
export const Default: Story = {
  render: () => (
    <FeatureFlagProvider>
      <FeatureDemo />
      <FeatureFlagDebugPanel />
    </FeatureFlagProvider>
  ),
};

/**
 * Without debug panel - production-like appearance
 */
export const ProductionLike: Story = {
  render: () => (
    <FeatureFlagProvider>
      <div className="p-8 bg-gray-900 text-white min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Production View</h1>
        <p className="text-gray-400">
          In production, the debug panel is not visible. Features are controlled
          via environment configuration.
        </p>
      </div>
    </FeatureFlagProvider>
  ),
};
