import { config } from '@verdocs/eslint-config/base';

// This package predates the shared config and gets its full standards pass
// alongside the types-pipeline work. Until then the stylistic layer is
// stripped so lint enforces correctness rules without a mass reformat.
const withoutStylistic = config.map(block =>
  block.rules
    ? {
        ...block,
        rules: Object.fromEntries(
          Object.entries(block.rules).filter(
            ([name]) => !name.startsWith('@stylistic/') && !name.startsWith('local/'),
          ),
        ),
      }
    : block,
);

export default [
  ...withoutStylistic,
  {
    ignores: ['docs/**', 'reports/**', 'rollup.config*', 'generated/**', '**/*.js', '**/*.cjs'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  {
    plugins: { verdocs: (await import('../../eslint-local.mjs')).default },
    rules: {
      'verdocs/no-non-ascii': 'error',
    },
  },
];
