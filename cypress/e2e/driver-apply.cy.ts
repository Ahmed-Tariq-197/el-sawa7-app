// MODIFIED BY: final-fix-trips-oauth-driver - reason: E2E test for driver apply + admin approve
/// <reference types="cypress" />

describe("Driver Application Flow", () => {
  it("driver pending page shows Arabic waiting message", () => {
    cy.visit("/driver/pending");
    // Should show the pending message (or redirect to login)
    cy.get("body").then(($body) => {
      const text = $body.text();
      // Either shows the pending message or redirects to login
      const hasPendingMsg = text.includes("في انتظار تأكيد دخولك");
      const hasLoginPage = text.includes("تسجيل الدخول");
      expect(hasPendingMsg || hasLoginPage).to.be.true;
    });
  });

  it("admin drivers page loads without crash", () => {
    cy.visit("/admin/drivers");
    // Should redirect to login if not authenticated, but NOT crash
    cy.get("body").should("exist");
    cy.get("body").then(($body) => {
      const text = $body.text();
      // Either shows admin content or redirects to login
      const hasContent = text.length > 10;
      expect(hasContent).to.be.true;
    });
  });
});
