// MODIFIED BY: final-fix-trips-oauth-driver - reason: verify no Lovable promotional UI on public pages
/// <reference types="cypress" />

describe("No Lovable Branding", () => {
  const publicPages = ["/", "/trips", "/about", "/contact", "/faq", "/login", "/register"];

  publicPages.forEach((page) => {
    it(`${page} should not contain Lovable promotional text`, () => {
      cy.visit(page);
      cy.get("body", { timeout: 10000 }).should("exist");

      cy.get("body").then(($body) => {
        const text = $body.text().toLowerCase();
        // Check for promotional Lovable content (not code references)
        expect(text).to.not.include("powered by lovable");
        expect(text).to.not.include("built with lovable");
        expect(text).to.not.include("made with lovable");
      });

      // No Lovable banner/badge elements
      cy.get('[data-testid="lovable-badge"]').should("not.exist");
      cy.get('[class*="lovable-banner"]').should("not.exist");
    });
  });
});
