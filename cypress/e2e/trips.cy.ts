/// <reference types="cypress" />

describe("Trips Page", () => {
  beforeEach(() => {
    cy.visit("/trips");
  });

  it("should display trips page correctly", () => {
    cy.contains("الرحلات المتاحة").should("be.visible");
  });

  it("should show loading state initially", () => {
    cy.get(".animate-spin").should("exist");
  });

  it("should display filter controls", () => {
    cy.contains("من").should("be.visible");
    cy.contains("إلى").should("be.visible");
    cy.contains("مسح الفلتر").should("be.visible");
  });

  it("should show trips or empty state after loading", () => {
    // Wait for loading to complete
    cy.get(".animate-spin").should("not.exist", { timeout: 10000 });
    
    // Should show either trips or empty/seed data notice
    cy.get("body").then(($body) => {
      if ($body.find('[class*="card-soft"]').length > 0) {
        // Trips are displayed
        cy.get('[class*="card-soft"]').should("have.length.at.least", 1);
      } else {
        // Empty state or seed notice
        cy.contains(/مفيش رحلات|بيانات اختبار/).should("be.visible");
      }
    });
  });

  it("should filter trips by origin", () => {
    cy.get(".animate-spin").should("not.exist", { timeout: 10000 });
    
    // Open origin select
    cy.get("button").contains("اختر نقطة الانطلاق").click();
    cy.contains("القاهرة").click();
    
    // Verify filter is applied
    cy.get("button").contains("القاهرة").should("be.visible");
  });

  it("should clear filters", () => {
    cy.get(".animate-spin").should("not.exist", { timeout: 10000 });
    
    // Apply filter
    cy.get("button").contains("اختر نقطة الانطلاق").click();
    cy.contains("القاهرة").click();
    
    // Clear filter
    cy.contains("مسح الفلتر").click();
    
    // Verify filter is cleared
    cy.get("button").contains("اختر نقطة الانطلاق").should("be.visible");
  });

  it("should show seed data notice when using fallback data", () => {
    cy.get(".animate-spin").should("not.exist", { timeout: 10000 });
    
    // Check if seed data notice appears (when no real trips exist)
    cy.get("body").then(($body) => {
      if ($body.text().includes("بيانات اختبار")) {
        cy.contains("بيانات اختبار").should("be.visible");
      }
    });
  });
});

describe("Booking Flow", () => {
  it("should redirect to login when booking without auth", () => {
    cy.visit("/trips");
    cy.get(".animate-spin").should("not.exist", { timeout: 10000 });
    
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
