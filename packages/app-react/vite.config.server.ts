import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import alias from './alias';

export default defineConfig({
  plugins: [react({ jsxImportSource: '@emotion/react' })],
  resolve: { alias },
  build: {
    ssr: true,
    outDir: 'dist/server',
    rollupOptions: {
      input: 'src/server/node.ts'
    },
    target: 'es2022'
  }
});
