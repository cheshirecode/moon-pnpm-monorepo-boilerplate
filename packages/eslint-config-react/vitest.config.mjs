import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['index.test.mjs'],
    coverage: {
      reporter: ['text', 'lcov']
    }
  }
});
