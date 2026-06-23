import { defineConfig } from 'vite';

export default defineConfig({
  // Standard config for a static vanilla SPA
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
