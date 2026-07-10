import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // js-sdk's CJS build calls axios-retry without default-export interop,
      // which breaks under Node's loader. Its ESM build is fine.
      '@verdocs/js-sdk': fileURLToPath(new URL('../js-sdk/dist/index.mjs', import.meta.url)),
    },
  },
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
