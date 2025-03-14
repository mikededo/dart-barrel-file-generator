import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.mts'),
      formats: ['cjs']
    },
    minify: false,
    outDir: resolve(__dirname, 'dist'),
    rollupOptions: {
      external: ['vscode', 'node:fs', 'node:path'],
      output: { entryFileNames: 'extension.js' }
    },
    sourcemap: true,
    ssr: true
  },
  resolve: {
    alias: {
      '@dbf/core': resolve(__dirname, '../core/src')
    }
  }
});
