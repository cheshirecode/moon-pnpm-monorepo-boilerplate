import Unocss from '@unocss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'path';

import alias from './alias';
import unocssConfig from './unocss.config';

export default defineConfig({
  plugins: [
    Unocss({}, unocssConfig),
    react({
      jsxImportSource: '@emotion/react'
    })
  ],
  resolve: {
    alias
  },
  build: {
    outDir: resolve(__dirname, 'dist/client'),
    assetsDir: 'static',
    manifest: true,
    rollupOptions: {
      input: {
        entry: resolve(__dirname, 'src/entry-hydration.tsx'),
      },
      output: {
        entryFileNames: 'entry-hydration.js',
        chunkFileNames: 'static/[name]-[hash].js',
        assetFileNames: 'static/[name]-[hash].[ext]',
      },
    },
  },
});
