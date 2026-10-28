import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The browser talks only to this origin; /v1 is proxied to the API, so session cookies stay first-party.
// API_TARGET is read here on the dev server and never reaches the client bundle.
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.WEB_PORT ?? "5173"),
    strictPort: true,
    proxy: { "/v1": { target: process.env.API_TARGET ?? "http://127.0.0.1:8080" } },
  },
  preview: {
    port: Number(process.env.WEB_PORT ?? "4173"),
    strictPort: true,
    proxy: { "/v1": { target: process.env.API_TARGET ?? "http://127.0.0.1:8080" } },
  },
  build: { target: "es2023", sourcemap: false },
});
