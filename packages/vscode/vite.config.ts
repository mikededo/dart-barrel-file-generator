import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.mts'),
      fileName: 'extension',
      formats: ['cjs']
    },
    minify: false,
    outDir: resolve(__dirname, 'dist'),
    rollupOptions: {
      external: ['vscode', 'node:fs', 'node:path', 'node:fs/promises']
    },
    sourcemap: true
  },
  resolve: {
    alias: {
      '@dbfg/core': resolve(__dirname, '../core/src')
    }
  }
});
