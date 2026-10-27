import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { qpdfCorePlugin } from "./scripts/qpdf-vite-plugin.ts";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), tailwindcss(), qpdfCorePlugin(), {
    name: 'spaf-build-receipt',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'build-info.json',
        source: JSON.stringify({
          node: process.versions.node,
          commit: process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null,
        }),
      });
    },
  }],
  worker: {
    plugins: () => [qpdfCorePlugin(false)],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
