import pluginVue from 'eslint-plugin-vue';
import tsParser from '@typescript-eslint/parser';
import { config } from '@verdocs/eslint-config/base';
import verdocsLocal from '../../eslint-local.mjs';

export default [
  ...config,
  ...pluginVue.configs['flat/recommended'],
  {
    // vue-eslint-parser owns .vue files; the TS parser handles their script
    // blocks so type syntax parses. Set via parserOptions, never the top-level
    // parser option, per the eslint-plugin-vue docs.
    files: [ '**/*.vue' ],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
    rules: {
      // The shared config only wires browser globals for ts/js files, and
      // vue-tsc already flags unknown identifiers in SFC scripts, so no-undef
      // adds nothing here but false positives on window and friends.
      'no-undef': 'off',
      // Props come from type-based defineProps, where optional props like an
      // endpoint override are meaningfully undefined; runtime defaults would
      // change behavior, not document it.
      'vue/require-default-prop': 'off',
    },
  },
  {
    // Specs define small probe components to host composables under test.
    files: [ '**/*.spec.ts' ],
    rules: {
      'vue/one-component-per-file': 'off',
    },
  },
  {
    plugins: { verdocs: verdocsLocal },
    rules: {
      'verdocs/no-non-ascii': 'error',
    },
  },
];
