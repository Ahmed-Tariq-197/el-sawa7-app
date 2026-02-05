/// <reference types="cypress" />

describe("Navigation", () => {
  it("should navigate to all public routes without 404", () => {
    const publicRoutes = [
      "/",
      "/about",
      "/contact",
      "/faq",
      "/trips",
      "/login",
      "/register",
    ];

    publicRoutes.forEach((route) => {
      cy.visit(route);
      cy.url().should("include", route);
      // Should not show 404 page
      cy.contains("الصفحة مش موجودة").should("not.exist");
    });
  });

  it("should show 404 for unknown routes", () => {
    cy.visit("/unknown-page-that-does-not-exist", { failOnStatusCode: false });
    cy.contains("الصفحة مش موجودة").should("be.visible");
  });

  it("should navigate back correctly", () => {
    cy.visit("/");
    cy.visit("/trips");
    cy.visit("/about");
    cy.go("back");
    cy.url().should("include", "/trips");
    cy.go("back");
    cy.url().should("eq", Cypress.config().baseUrl + "/");
  });

  it("should have working header navigation", () => {
    cy.visit("/");
    
    // Test header links
    cy.contains("الرحلات").click();
    cy.url().should("include", "/trips");

    cy.contains("عن المنصة").click();
    cy.url().should("include", "/about");

    cy.contains("الأسئلة الشائعة").click();
    cy.url().should("include", "/faq");

    cy.contains("تواصل معنا").click();
    cy.url().should("include", "/contact");
  });

  it("should have working footer links", () => {
    cy.visit("/");
    cy.scrollTo("bottom");
    
    // Test footer links exist
    cy.get("footer").within(() => {
      cy.contains("الرحلات").should("be.visible");
      cy.contains("عن المنصة").should("be.visible");
      cy.contains("الأسئلة الشائعة").should("be.visible");
      cy.contains("تواصل معنا").should("be.visible");
    });
  });
});
