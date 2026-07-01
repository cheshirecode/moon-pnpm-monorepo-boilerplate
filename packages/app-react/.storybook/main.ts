import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import UnoCSS from '@unocss/vite';
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  core: {
    disableTelemetry: true
  },
  viteFinal: async (config) =>
    mergeConfig(config, {
      plugins: [UnoCSS()],
      resolve: {
        alias: {
          '~': root,
          '@': resolve(root, 'src'),
          lodash: 'lodash-es'
        }
      },
      build: {
        chunkSizeWarningLimit: 1500,
        target: 'es2022',
        commonjsOptions: {
          transformMixedEsModules: true
        }
      },
      optimizeDeps: {
        include: ['@emotion/react/jsx-dev-runtime', '@unocss/preset-mini']
      }
    })
};

export default config;
