import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// The examples resolve the package straight from `../../src` (bun can't link a workspace root
// into its own members), so editing the library hot-reloads here. Mirrored in tsconfig `paths`.
const src = (path: string) =>
  decodeURIComponent(new URL(`../../src/${path}`, import.meta.url).pathname);

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@zkmake\/three-meter$/, replacement: src("index.ts") },
      { find: /^@zkmake\/three-meter\/(ui|react)$/, replacement: src("$1/index.ts") },
    ],
  },
  server: { port: 3022, strictPort: true },
  // three alone is ~600 kB minified; the warning would fire on every build.
  build: { chunkSizeWarningLimit: 1000 },
  preview: { port: 3022, strictPort: true },
  plugins: [react()],
});
