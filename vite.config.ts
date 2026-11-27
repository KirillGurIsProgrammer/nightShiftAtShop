import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'node',
  },
});
