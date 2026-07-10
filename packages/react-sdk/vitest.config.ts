import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // js-sdk's CJS build calls axios-retry without default-export interop,
      // which breaks under Node's loader. Its ESM build is fine, so point
      // tests at that; bundlers pick it naturally via the module field.
      '@verdocs/js-sdk': fileURLToPath(new URL('../js-sdk/dist/index.mjs', import.meta.url)),
    },
  },
  test: {
    name: 'react-sdk',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
