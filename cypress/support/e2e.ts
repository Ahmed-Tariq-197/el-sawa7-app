// Cypress E2E Support File
import "./commands";

// Prevent TypeScript errors for Cypress globals
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      preserveSession(): Chainable<void>;
    }
  }
}

// Disable uncaught exception handling for tests
Cypress.on("uncaught:exception", (err, runnable) => {
  // Returning false prevents Cypress from failing the test
  console.error("Uncaught exception:", err.message);
  return false;
});

// Clear localStorage and sessionStorage before each test
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
});
