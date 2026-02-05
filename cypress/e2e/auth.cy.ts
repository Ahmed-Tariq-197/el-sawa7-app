/// <reference types="cypress" />

describe("Authentication Flow", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should display login page correctly", () => {
    cy.visit("/login");
    cy.contains("تسجيل الدخول").should("be.visible");
    cy.get('input[type="email"]').should("be.visible");
    cy.get('input[type="password"]').should("be.visible");
  });

  it("should display registration page correctly", () => {
    cy.visit("/register");
    cy.contains("إنشاء حساب").should("be.visible");
    cy.get('input[type="email"]').should("be.visible");
    cy.get('input[type="password"]').should("be.visible");
  });

  it("should show validation errors for invalid login", () => {
    cy.visit("/login");
    cy.get('button[type="submit"]').click();
    // Should show validation errors
    cy.get('input[type="email"]:invalid').should("exist");
  });

  it("should navigate between login and register pages", () => {
    cy.visit("/login");
    cy.contains("إنشاء حساب").click();
    cy.url().should("include", "/register");

    cy.contains("تسجيل الدخول").click();
    cy.url().should("include", "/login");
  });
});
