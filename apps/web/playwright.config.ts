import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run the real API against a fresh PostgreSQL database and the Vite dev server.
// E2E_DATABASE_URL points at a database whose name starts with p27_e2e; it is dropped and recreated.
const API_PORT = 8090;
const WEB_PORT = 5174;
const database = process.env.E2E_DATABASE_URL ?? "postgres://localhost:5433/p27_e2e";

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "node ../api/test/e2e-db.ts && node ../api/src/server.ts",
      url: `http://127.0.0.1:${API_PORT}/v1/health`,
      reuseExistingServer: false,
      env: {
        DATABASE_URL: database,
        PORT: String(API_PORT),
        WEB_ORIGINS: `http://127.0.0.1:${WEB_PORT}`,
        COOKIE_SECURE: "false",
        AUTH_ATTEMPTS_PER_MINUTE: "1000",
        // Test-only key for the throwaway e2e database; production keys come from a secret manager.
        TOTP_KEY: "ohG39EpfWTPPTDi0zcBTbs5RwDDXaKD2R0nZ0zDBhI8=",
      },
    },
    {
      command: `npx vite --host 127.0.0.1 --port ${WEB_PORT}`,
      url: `http://127.0.0.1:${WEB_PORT}`,
      reuseExistingServer: false,
      env: { API_TARGET: `http://127.0.0.1:${API_PORT}`, WEB_PORT: String(WEB_PORT) },
    },
  ],
});
