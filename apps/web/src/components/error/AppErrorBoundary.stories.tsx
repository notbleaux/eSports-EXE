// @ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { AppErrorBoundary } from './AppErrorBoundary';

/**
 * AppErrorBoundary is the top-level error boundary that catches uncaught errors
 * and displays a user-friendly error page with recovery options.
 */
const meta: Meta<typeof AppErrorBoundary> = {
  title: 'Components/Error/AppErrorBoundary',
  component: AppErrorBoundary,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Top-level error boundary with graceful error recovery and hub navigation.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AppErrorBoundary>;

// Component that throws an error
const ErrorThrower = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error for Storybook');
  }
  return <div className="p-8 text-white">Content renders successfully</div>;
};

/**
 * Default state - no error, children render normally
 */
export const Default: Story = {
  args: {
    children: <ErrorThrower shouldThrow={false} />,
  },
};

/**
 * Error state - displays the error fallback UI
 */
export const ErrorState: Story = {
  render: () => (
    <AppErrorBoundary>
      <ErrorThrower shouldThrow={true} />
    </AppErrorBoundary>
  ),
};

/**
 * Custom fallback - uses custom error UI
 */
export const CustomFallback: Story = {
  args: {
    children: <ErrorThrower shouldThrow={true} />,
    fallback: (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Custom Error Page</h1>
          <p>This is a custom fallback component.</p>
        </div>
      </div>
    ),
  },
};
