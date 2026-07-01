/// <reference types="vitest" />

import { defineConfig } from 'vitest/config';

import { configDefaults, packageTestConfig } from '../../vitest.shared.mjs';

export default defineConfig(
  packageTestConfig({
    globals: true,
    include: ['**/*(*.)?{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [...configDefaults.exclude, './test/**/*']
  })
);
