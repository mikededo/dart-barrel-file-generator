import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: ['src/bin.ts'],
      formats: ['cjs']
    },
    minify: false,
    outDir: 'dist',
    sourcemap: true,
    ssr: true,
    target: 'node20'
  },
  resolve: {
    alias: {
      '@dbfg/core': resolve(__dirname, '../core/src')
    }
  },
  ssr: { noExternal: true }
});
