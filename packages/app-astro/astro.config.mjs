import { defineConfig } from 'astro/config';

// SITE_BASE lets the combined Netlify build serve this app under a subpath
// (e.g. /apps/astro/). Defaults to '/' for standalone dev/build.
export default defineConfig({
  base: process.env.SITE_BASE || '/',
  output: 'static',
  build: {
    format: 'directory'
  }
});
