import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // `server-only` throws at import time in any non-Next context. Map it
      // to a local empty module so tests that transitively import a
      // server-marked module still load.
      'server-only': path.resolve(__dirname, 'vitest.server-only-stub.ts'),
    },
  },
});
