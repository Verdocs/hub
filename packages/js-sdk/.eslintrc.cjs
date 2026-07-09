module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'no-useless-escape': 'off',
    "no-case-declarations": "off",
    '@typescript-eslint/no-floating-promises': [
      'error',
      {
        ignoreVoid: false,
        ignoreIIFE: false,
      },
    ],
  },
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
};