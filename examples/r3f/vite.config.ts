import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  server: { port: 3022, strictPort: true },
  preview: { port: 3022, strictPort: true },
  plugins: [react()],
});
