import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/styles/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#050508',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'sator',
          value: '#0a0a0f',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#050508] text-white p-4">
        <Story />
      </div>
    ),
  ],
};

export default preview;
