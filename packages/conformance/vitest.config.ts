import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'conformance',
    environment: 'node',
    globals: true,
    // These tests hit the live beta API sequentially and share session state.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
