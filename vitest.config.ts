import { defineConfig } from 'vitest/config';
import path from 'path';

// Unit tests only. The Playwright suite under e2e/ runs against the built
// extension and has its own config.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
  },
});
