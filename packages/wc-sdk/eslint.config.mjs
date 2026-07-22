import baseConfig from '@verdocs/eslint-config/base';
import verdocsLocal from '../../eslint-local.mjs';

export default [
  ...baseConfig,
  {
    plugins: { verdocs: verdocsLocal },
    rules: {
      'verdocs/no-non-ascii': 'error',
    },
  },
];
