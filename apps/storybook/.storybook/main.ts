import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',

  // Stories are colocated with the react-sdk source so they can never drift
  // from the components they document.
  stories: ['../../../packages/react-sdk/src/**/*.stories.tsx'],

  async viteFinal(viteConfig) {
    const { default: tailwindcss } = await import('@tailwindcss/vite');
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];
    return viteConfig;
  },
};

export default config;
