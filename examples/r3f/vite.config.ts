import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: { port: 3022, strictPort: true },
  // three alone is ~600 kB minified; the warning would fire on every build.
  build: { chunkSizeWarningLimit: 1000 },
  preview: { port: 3022, strictPort: true },
  plugins: [react()],
});
