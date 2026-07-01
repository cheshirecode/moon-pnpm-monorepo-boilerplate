/// <reference types="vitest" />

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

import { viteAppTestConfig } from '../../vitest.shared.mjs';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser']
  },
  build: {
    reportCompressedSize: !process.env.CI,
    target: 'es2022'
  },
  test: viteAppTestConfig({
    include: ['src/**/*.test.ts']
  })
});
