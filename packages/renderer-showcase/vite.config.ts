/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

import { viteAppTestConfig } from '../../vitest.shared.mjs';

export default defineConfig({
  plugins: [
    react({
      include: /packages\/app-react\/src\/.*\.[jt]sx$/
    }),
    vue(),
    svelte(),
    solid({
      hot: false,
      include: /packages\/app-solidjs\/src\/.*\.[jt]sx$/
    })
  ],
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
