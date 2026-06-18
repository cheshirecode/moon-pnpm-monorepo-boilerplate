/// <reference types="vitest" />
import Unocss from '@unocss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import vitePluginImportus from 'vite-plugin-importus';
import { configDefaults } from 'vitest/config';

import alias from './alias';
import pkg from './package.json';
import unocssConfig from './unocss.config';

const isCI = !!process.env.CI;

const vendorModules = ['react', 'faker', 'react-table', 'react-virtual', 'lodash'];

// https://vitejs.dev/config/
export default defineConfig((config) => ({
  plugins: [
    Unocss({}, unocssConfig),
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: []
        // presets are not working right now, try again and install @babel/preset-env core-js@3.25.3
        // presets: [
        //   [
        //     '@babel/preset-env',
        //     {
        //       useBuiltIns: 'usage',
        //       corejs: { version: '3.25', proposals: true }
        //     }
        //   ]
        // ]
      }
      // https://github.com/vitejs/awesome-vite#plugins
    }),
    ...(config.command === 'build'
      ? [
          vitePluginImportus([
            {
              libraryName: 'lodash-es',
              customName: (name: string) => {
                return `lodash-es/${name}`;
              },
              camel2DashComponentName: false
            }
          ])
        ]
      : [])
  ],
  resolve: {
    alias
  },
  base: '/',
  clearScreen: false,
  build: {
    // skip minification to make tests faster
    minify: config.mode !== 'test' ? 'esbuild' : false,
    commonjsOptions: {
      transformMixedEsModules: true,
      esmExternals: true
    },
    rollupOptions: {
      output: {
        manualChunks: (id, { getModuleInfo }) => {
          if (id.includes('node_modules')) {
            const dependents = [];
            const m = vendorModules.find((x) => id.includes(`/${x}`)) ?? '';
            const uniqueName = `vendor${m ? `-${m}` : ''}`;
            // we use a Set here so we handle each module at most once. This
            // prevents infinite loops in case of circular dependencies
            const idsToHandle = new Set(getModuleInfo(id).dynamicImporters);
            for (const moduleId of idsToHandle) {
              const { isEntry, dynamicImporters, importers } = getModuleInfo(moduleId);
              if (isEntry || dynamicImporters.length > 0) dependents.push(moduleId);
              for (const importerId of importers) idsToHandle.add(importerId);
            }

            return dependents.length === 1 ? uniqueName : `shared.${uniqueName}`;
          }
        }
      }
    },
    // speed up build during pipelines
    reportCompressedSize: !isCI,
    target: 'es2022'
  },
  optimizeDeps: {
    // disabled: false,
    include: ['hoist-non-react-statics', '@emotion/react/jsx-dev-runtime', '@unocss/preset-mini'],
    exclude: []
  },
  define: {
    // flag to enable MirageJS to mock API
    'process.env.__MOCK_API__': [
      'test'
      // , 'development'
    ].includes(config.mode),
    'process.env.__VERSION__': JSON.stringify(pkg.version)
  },
  css: {
    devSourcemap: true
  },
  json: {
    stringify: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/services/test/setup.js'],
    include: ['**/*(*.)?{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [...configDefaults.exclude, 'src/test/**/*'],
    coverage: {
      reporter: [
        ['lcov', { projectRoot: './src' }],
        ['json', { file: 'coverage.json' }],
        ['text'],
        ['html', { subdir: './html' }]
      ],
      provider: 'v8'
    }
  }
}));
