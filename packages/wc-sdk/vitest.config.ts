import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// Component tests run in a real Chromium per docs/standards/web-components.md
// rule 22; jsdom is banned for components. The root workspace picks this
// config up through its projects glob.
export default defineConfig({
  test: {
    name: 'wc-sdk',
    globals: true,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [ { browser: 'chromium' } ],
    },
  },
});
