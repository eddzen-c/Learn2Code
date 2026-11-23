import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'site-public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
