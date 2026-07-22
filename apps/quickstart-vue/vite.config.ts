import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// 5174 keeps this quickstart runnable alongside the React one on 5173.
export default defineConfig({
  plugins: [vue()],
  server: { port: 5174 },
});
