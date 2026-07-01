/// <reference types="vitest" />

import solid from 'vite-plugin-solid';
import { defineConfig } from 'vite';

import { viteAppTestConfig } from '../../vitest.shared.mjs';

export default defineConfig({
  plugins: [solid({ hot: false })],
  build: {
    reportCompressedSize: !process.env.CI,
    target: 'es2022'
  },
  test: viteAppTestConfig({
    include: ['src/**/*.test.tsx'],
    setupFiles: []
  })
});
