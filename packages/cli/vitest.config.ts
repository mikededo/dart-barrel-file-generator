import { defineConfig } from 'vitest/config';

// Set up Vitest configuration
export default defineConfig({
  test: {
    globals: true,
    include: ['./test/bin.test.ts']
  }
});

