import Unocss from '@unocss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
  ssr: {
    noExternal: ['hono', '@hono/node-server'],
    external: []
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@emotion/react']
  }
});
