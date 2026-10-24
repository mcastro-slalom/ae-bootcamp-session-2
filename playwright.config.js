const { defineConfig, devices } = require('@playwright/test');

const frontendPort = process.env.FRONTEND_PORT || '3000';
const backendPort = process.env.BACKEND_PORT || '3030';
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const backendUrl = `http://127.0.0.1:${backendPort}`;

process.env.BACKEND_URL = backendUrl;

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: frontendUrl,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start:backend',
      url: `${backendUrl}/`,
      env: { NODE_ENV: 'test', PORT: backendPort },
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'npm run start:frontend',
      url: frontendUrl,
      env: { PORT: frontendPort, REACT_APP_API_BASE_URL: backendUrl },
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});