import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4173",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      // Test user credentials (create these in Supabase for testing)
      TEST_USER_EMAIL: "test@elsawa7.com",
      TEST_USER_PASSWORD: "TestPassword123!",
      TEST_ADMIN_EMAIL: "admin@elsawa7.com",
      TEST_ADMIN_PASSWORD: "AdminPassword123!",
    },
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
