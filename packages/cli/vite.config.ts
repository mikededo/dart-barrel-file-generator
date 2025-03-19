import { resolve } from 'node:path';
import { nodeExternals } from 'rollup-plugin-node-externals';
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
  plugins: [
    nodeExternals()
  ],
  resolve: {
    alias: {
      '@dbf/core': resolve(__dirname, '../core/src')
    }
  },
  ssr: { noExternal: true }
});
