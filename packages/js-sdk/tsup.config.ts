import {defineConfig} from 'tsup';

// Dual CJS + ESM build with a single declaration file. Output names match the
// package.json main/module/types fields: dist/index.js (cjs), dist/index.mjs
// (esm), dist/index.d.ts. axios stays external, everything else is bundled.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  // tsup injects baseUrl into the declaration build, which TypeScript 6 rejects as
  // deprecated unless acknowledged. Our own tsconfig does not set it.
  dts: {compilerOptions: {ignoreDeprecations: '6.0'}},
  sourcemap: true,
  clean: true,
  target: 'es2022',
  external: ['axios'],
  outExtension: ({format}) => ({js: format === 'cjs' ? '.js' : '.mjs'}),
});
