import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  testIgnore: '**/offline/**',
  timeout: 45000,
  fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'firefox',
      testMatch: [
        '**/core.spec.ts',
        '**/content-design.spec.ts',
        '**/qr.spec.ts',
        '**/template-matrix.spec.ts',
      ],
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
})
