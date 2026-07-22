import { config } from '@verdocs/eslint-config/base';
import verdocsLocal from '../../eslint-local.mjs';

export default [
  { ignores: [ '.angular/**', 'coverage/**' ] },
  ...config,
  {
    plugins: { verdocs: verdocsLocal },
    rules: {
      'verdocs/no-non-ascii': 'error',
    },
  },
];
