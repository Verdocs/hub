import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // tsup injects baseUrl into the declaration build, which TypeScript 6 rejects unless acknowledged.
  dts: {compilerOptions: {ignoreDeprecations: '6.0'}},
  sourcemap: true,
  clean: true,
  target: 'es2022',
  external: ['react', 'react-dom'],
});
