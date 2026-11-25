import { defineConfig } from 'vitest/config';

export default defineConfig({
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
