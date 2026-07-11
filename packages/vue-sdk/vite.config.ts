import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// Library build only bundles the JS; type declarations come from vue-tsc (see
// the build script) because plain tsc cannot read SFCs.
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: format => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    sourcemap: true,
    rollupOptions: {
      // Vite lib mode bundles everything by default; match tsup's behavior in
      // the react-sdk, where dependencies and peers stay external.
      external: ['vue', '@verdocs/js-sdk', '@tanstack/vue-query'],
    },
  },
});
