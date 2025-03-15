import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es']
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        'commander',
        'valibot',
        'node:fs',
        'node:path'
      ]
    },
    target: 'node20'
  },
  resolve: {
    alias: {
      '@dbf/core': resolve(__dirname, '../core/src')
    }
  }
});
