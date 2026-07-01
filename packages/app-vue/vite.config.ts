/// <reference types="vitest" />

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

import { viteAppTestConfig } from '../../vitest.shared.mjs';

export default defineConfig({
  plugins: [vue()],
  build: {
    reportCompressedSize: !process.env.CI,
    target: 'es2022'
  },
  test: viteAppTestConfig({
    include: ['src/**/*.test.ts']
  })
});
