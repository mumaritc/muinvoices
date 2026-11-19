import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/offline',
  outputDir: 'test-results-offline',
  timeout: 45000,
  workers: 1,
  use: { ...devices['Desktop Chrome'], trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'root', use: { baseURL: 'http://127.0.0.1:4173/' } },
    { name: 'subpath', use: { baseURL: 'http://127.0.0.1:4174/muinvoice/' } },
  ],
  webServer: [
    {
      command: 'npm run preview -- --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
    },
    {
      command: 'npm run preview -- --port 4174 --base /muinvoice/',
      url: 'http://127.0.0.1:4174/muinvoice/',
      reuseExistingServer: false,
    },
  ],
})
