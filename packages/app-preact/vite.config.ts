/// <reference types="vitest" />

import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

import { viteAppTestConfig } from '../../vitest.shared.mjs';

export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      react: 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime'
    }
  },
  build: {
    reportCompressedSize: !process.env.CI,
    target: 'es2022'
  },
  test: viteAppTestConfig({
    include: ['src/**/*.test.tsx']
  })
});
