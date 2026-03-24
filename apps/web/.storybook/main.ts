import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    builder: '@storybook/builder-vite',
  },
  viteFinal: async (config) => {
    // Add path aliases
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '/src',
      '@shared': '/src/shared',
      '@hub-1': '/src/hub-1-sator',
      '@hub-2': '/src/hub-2-rotas',
      '@hub-3': '/src/hub-3-arepo',
      '@hub-4': '/src/hub-4-opera',
      '@hub-5': '/src/hub-5-tenet',
    };
    return config;
  },
};

export default config;
