import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));

function normalizeBase(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "/";
  if (trimmed === "./") return "./";
  if (trimmed.endsWith("/")) return trimmed;
  return `${trimmed}/`;
}

export default defineConfig(({ command }) => {
  // Environment variables with defaults
  const envBase = process.env.CLIENT_WEB_BASE_PATH?.trim();
  const base = envBase ? normalizeBase(envBase) : "./";
  const port = parseInt(process.env.CLIENT_WEB_PORT || "2308", 10);
  const apiTarget = process.env.CLIENT_WEB_API_TARGET || "http://127.0.0.1:3025";

  return {
    base,
    publicDir: path.resolve(here, "public"),
    optimizeDeps: {
      include: ["lit/directives/repeat.js"],
    },
    build: {
      outDir: path.resolve(here, "../dist/client-web"),
      emptyOutDir: true,
      sourcemap: true,
    },
    server: {
      host: true,
      port,
      strictPort: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          // No rewrite - Operis API uses /api prefix
          ws: true,
        },
      },
    },
  };
});
