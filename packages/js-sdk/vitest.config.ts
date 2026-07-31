import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'js-sdk',
    environment: 'node',
    globals: true,
    include: ['src/__tests__/**/*.ts'],
  },
});
