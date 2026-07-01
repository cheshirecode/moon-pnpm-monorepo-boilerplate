/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath, URL } from 'node:url';
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
    alias: {
      '@': fileURLToPath(new URL('../app-react/src', import.meta.url)),
      'app-astro/demo': fileURLToPath(new URL('../app-astro/src/demo.ts', import.meta.url)),
      'app-preact/microfrontend': fileURLToPath(
        new URL('../app-preact/src/microfrontend.tsx', import.meta.url)
      ),
      'app-react/microfrontend': fileURLToPath(
        new URL('../app-react/src/microfrontend.tsx', import.meta.url)
      ),
      'app-solidjs/microfrontend': fileURLToPath(
        new URL('../app-solidjs/src/microfrontend.tsx', import.meta.url)
      ),
      'app-svelte/microfrontend': fileURLToPath(
        new URL('../app-svelte/src/microfrontend.ts', import.meta.url)
      ),
      'app-vue/microfrontend': fileURLToPath(
        new URL('../app-vue/src/microfrontend.ts', import.meta.url)
      )
    },
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
