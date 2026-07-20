/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import solid from 'vite-plugin-solid';
import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';

import { viteAppTestConfig } from '../../vitest.shared.mjs';

const requirePkg = createRequire(import.meta.url);
const packageVersion = (name: string): string | undefined => {
  try {
    return (requirePkg(`${name}/package.json`) as { version: string }).version;
  } catch {
    return undefined;
  }
};

// Framework versions come from the showcase's own dependencies (no sibling reads).
const frameworkVersions = {
  react: packageVersion('react'),
  preact: packageVersion('preact'),
  vue: packageVersion('vue'),
  svelte: packageVersion('svelte'),
  'solid-js': packageVersion('solid-js')
};

// Netlify exposes these during the build; absent locally.
const buildInfo = {
  commit: process.env.COMMIT_REF,
  context: process.env.CONTEXT,
  branch: process.env.BRANCH,
  builtAt: new Date().toISOString()
};

export default defineConfig({
  define: {
    __FRAMEWORK_VERSIONS__: JSON.stringify(frameworkVersions),
    __BUILD_INFO__: JSON.stringify(buildInfo)
  },
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
