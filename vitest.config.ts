import { defineConfig } from 'vitest/config';

// Root runner for the workspace. The conformance suite is excluded here on
// purpose: it hits the live beta API and runs via `pnpm conformance`.
export default defineConfig({
  test: {
    projects: [
      'packages/*/vitest.config.ts',
      'apps/*/vitest.config.ts',
      '!packages/conformance/**',
    ],
    reporters: ['default', 'html'],
    outputFile: {
      html: 'reports/vitest/index.html',
    },
  },
});
