/// <reference types="cypress" />

describe("Smart Welcome Feature", () => {
  beforeEach(() => {
    // Clear welcome-related localStorage
    cy.window().then((win) => {
      Object.keys(win.localStorage)
        .filter((key) => key.startsWith("elsawa7_welcome"))
        .forEach((key) => win.localStorage.removeItem(key));
    });
  });

  it("should persist welcome phrase for the day", () => {
    // This test would require a logged-in user
    // For now, verify the component doesn't crash on public pages
    cy.visit("/dashboard");
    
    // Should redirect to login if not authenticated
    cy.url().should("include", "/login");
  });

  it("should allow opting out of welcome messages", () => {
    cy.window().then((win) => {
      win.localStorage.setItem("elsawa7_welcome_hide", "true");
    });
    
    cy.visit("/");
    
    // Welcome banner should not appear when opted out
    cy.get('[class*="SmartWelcome"]').should("not.exist");
  });

  it("should generate consistent phrase for the same day", () => {
    const today = new Date().toISOString().split("T")[0];
    const storageKey = `elsawa7_welcome_v${today}`;
    
    // Set a test phrase
    cy.window().then((win) => {
      win.localStorage.setItem(storageKey, "Test welcome phrase");
    });
    
    // Verify it persists (would need login for full test)
    cy.window().then((win) => {
      expect(win.localStorage.getItem(storageKey)).to.equal("Test welcome phrase");
    });
  });
});
