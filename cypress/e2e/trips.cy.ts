/// <reference types="cypress" />
// MODIFIED BY: final-fix-trips-oauth-driver - reason: Enhanced tests for trips fallback

describe("Trips Page - Never Blank", () => {
  beforeEach(() => {
    cy.visit("/trips");
  });

  it("should display trips page correctly - never blank", () => {
    // Wait for loading to complete
    cy.get(".animate-spin", { timeout: 15000 }).should("not.exist");
    
    // Page should NEVER be blank - either show trips or seed data banner
    cy.get("body").should("not.be.empty");
    cy.contains("الرحلات المتاحة").should("be.visible");
  });

  it("should show loading state initially", () => {
    cy.get(".animate-spin").should("exist");
  });

  it("should display filter controls", () => {
    cy.get(".animate-spin", { timeout: 15000 }).should("not.exist");
    cy.contains("من").should("be.visible");
    cy.contains("إلى").should("be.visible");
    cy.contains("مسح الفلتر").should("be.visible");
  });

  it("should show trips or seed data fallback - NEVER blank page", () => {
    // Wait for loading to complete
    cy.get(".animate-spin", { timeout: 15000 }).should("not.exist");
    
    // Must show one of: real trips, seed trips with banner, or empty state with message
    cy.get("body").then(($body) => {
      const hasTrips = $body.find('[class*="card-soft"]').length > 1; // More than just filter card
      const hasSeedBanner = $body.text().includes("بيانات اختبار");
      const hasEmptyState = $body.text().includes("مفيش رحلات");
      
      // At least one of these must be true - page should NEVER be completely blank
      expect(hasTrips || hasSeedBanner || hasEmptyState).to.be.true;
    });
  });

  it("should filter trips by origin", () => {
    cy.get(".animate-spin", { timeout: 15000 }).should("not.exist");
    
    // Open origin select
    cy.get("button").contains("اختر نقطة الانطلاق").click();
    cy.contains("القاهرة").click();
    
    // Verify filter is applied
    cy.get("button").contains("القاهرة").should("be.visible");
  });

  it("should clear filters", () => {
    cy.get(".animate-spin", { timeout: 15000 }).should("not.exist");
    
    // Apply filter
    cy.get("button").contains("اختر نقطة الانطلاق").click();
    cy.contains("القاهرة").click();
    
    // Clear filter
    cy.contains("مسح الفلتر").click();
    
    // Verify filter is cleared
    cy.get("button").contains("اختر نقطة الانطلاق").should("be.visible");
  });

  it("should display seed data notice when using fallback data", () => {
    cy.get(".animate-spin", { timeout: 15000 }).should("not.exist");
    
    // Check if seed data notice appears (when no real trips exist)
    cy.get("body").then(($body) => {
      if ($body.text().includes("بيانات اختبار")) {
        cy.contains("هذه بيانات اختبار").should("be.visible");
        cy.contains("ستظهر الرحلات الحقيقية بعد تفعيل لوحة السواّح").should("be.visible");
      }
    });
  });
});

describe("Booking Flow", () => {
  it("should redirect to login when booking without auth", () => {
    cy.visit("/trips");
    cy.get(".animate-spin", { timeout: 15000 }).should("not.exist");
    
    // Find a book button (if trips exist)
    cy.get("body").then(($body) => {
      if ($body.find('a[href^="/book/"]').length > 0) {
        cy.get('a[href^="/book/"]').first().click();
        // Should require login
        cy.url().should("include", "/login");
      }
    });
  });
});
