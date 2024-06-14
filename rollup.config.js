import ts from 'rollup-plugin-ts';
import copy from 'rollup-plugin-copy';
import clear from 'rollup-plugin-clear';
import commonjs from '@rollup/plugin-commonjs';

const pkg = require('./package.json');

module.exports = {
  input: 'src/index.ts',
  output: [
    {file: pkg.main, format: 'cjs', sourcemap: true},
    {file: pkg.module, format: 'esm', sourcemap: true},
  ],
  external: [
    // ...builtinModules,
    ...(pkg.dependencies ? Object.keys(pkg.dependencies) : []),
    ...(pkg.devDependencies ? Object.keys(pkg.devDependencies) : []),
    ...(pkg.peerDependencies ? Object.keys(pkg.peerDependencies) : []),
  ],
  watch: {
    include: 'src/**',
  },
  plugins: [
    clear({
      targets: ['dist'],
      watch: false,
    }),
    ts({
      hook: {
        // Always rename declaration files to index.d.ts to avoid emitting two declaration files with identical contents
        // outputPath: (path, kind) => (kind === 'declaration' ? './dist/index.d.ts' : `out/${path}`),
        // declarationStats: (declarationStats) => console.log(declarationStats),
      },
    }),
    commonjs(),
    copy({
      targets: [
        {src: 'README.md', dest: 'dist/'},
        {src: 'package.json', dest: 'dist/'},
        {src: 'tsconfig.json', dest: 'dist/'},
      ],
    }),
  ],
};
