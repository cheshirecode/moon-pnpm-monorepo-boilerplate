/// <reference types="vitest" />
import { resolve } from "path";

import react from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import dts from "vite-plugin-dts";
import { defineConfig } from "vite";

import {
  configDefaults,
  coverageConfigDefaults,
  viteAppTestConfig,
} from "../../vitest.shared.mjs";

const isSite = !!process.env.SITE;
const coverageExclude = [...coverageConfigDefaults.exclude, "site/**/*"];

export default defineConfig((config) => ({
  plugins: [react(), UnoCSS(), ...(isSite ? [] : [dts({ include: ["lib/**/*.ts"], entryRoot: "lib" })])],
  build: {
    // skip minification to make tests faster
    minify: config.mode !== "test" ? "esbuild" : false,
    copyPublicDir: false,
    ...(isSite
      ? { outDir: "site" }
      : {
          lib: {
            entry: resolve(__dirname, "lib/index.ts"),
            formats: ["es"],
            fileName: "lib",
          },
          rollupOptions: {
            external: [
              "react",
              "react-dom",
              "crypto-js",
              "dayjs",
              "js-cookie",
              "@cheshirecode/browser-clipboard",
            ],
          },
        }),
  },
  test: viteAppTestConfig({
    environmentOptions: {
      happyDOM: {
        url: "https://localhost/",
      },
    },
    setupFiles: ["src/services/test/setup.ts"],
    exclude: [...configDefaults.exclude, "site/**/*"],
    coverage: {
      exclude: coverageExclude,
      reporter: [
        ["lcov"],
        ["json", { file: "coverage.json" }],
        ["text"],
        ["html", { subdir: "./html" }],
      ],
      provider: "v8",
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 40,
        statements: 50,
      },
    },
  }),
  resolve: {
    alias: {
      "~": resolve(__dirname, "./"),
      "@": resolve(__dirname, "./src"),
    },
  },
}));
