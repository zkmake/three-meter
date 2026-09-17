import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: { port: 3021, strictPort: true },
  preview: { port: 3021, strictPort: true },
});
