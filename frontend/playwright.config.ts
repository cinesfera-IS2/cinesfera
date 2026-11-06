import { defineConfig, devices } from "@playwright/test";

// Los tests nunca tocan Supabase: e2e/entorno/backend.mjs levanta un Postgres
// propio, vacío en cada corrida, con el FastAPI del repo conectado a él. El
// frontend corre en otro puerto para no mezclarse con el `pnpm dev` de siempre.
const PUERTO_FRONTEND = 3100;
const PUERTO_BACKEND = 8100;
const URL_BACKEND = `http://localhost:${PUERTO_BACKEND}`;

process.env.E2E_URL_BACKEND = URL_BACKEND;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/entorno/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PUERTO_FRONTEND}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node e2e/entorno/backend.mjs",
      url: `${URL_BACKEND}/`,
      env: {
        E2E_PUERTO_BACKEND: String(PUERTO_BACKEND),
        E2E_PUERTO_FRONTEND: String(PUERTO_FRONTEND),
      },
      // Nunca reutilizar: un backend ya levantado podría estar usando Supabase.
      reuseExistingServer: false,
      gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
      // La primera vez puede tener que crear backend/.venv e instalar dependencias.
      timeout: 300_000,
      stdout: "pipe",
    },
    {
      command: `pnpm exec next dev --port ${PUERTO_FRONTEND}`,
      url: `http://localhost:${PUERTO_FRONTEND}`,
      env: { NEXT_PUBLIC_API_URL: URL_BACKEND, NEXT_DIST_DIR: ".next/e2e" },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
