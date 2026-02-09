/// <reference types="cypress" />
// MODIFIED BY: final-fix-trips-oauth-driver - reason: Enhanced auth and driver tests

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
    cy.contains("سجّل دلوقتي").click();
    cy.url().should("include", "/register");

    cy.contains("سجّل دخولك").click();
    cy.url().should("include", "/login");
  });

  it("should display Google sign-in button on login page", () => {
    cy.visit("/login");
    cy.contains("تسجيل بحساب Google").should("be.visible");
  });

  it("should display Google sign-in button on register page", () => {
    cy.visit("/register");
    cy.contains("تسجيل بحساب Google").should("be.visible");
  });

  it("should show role selection on register page", () => {
    cy.visit("/register");
    cy.contains("راكب").should("be.visible");
    cy.contains("سائق").should("be.visible");
  });
});

describe("Protected Routes - OAuth Redirect Fix", () => {
  it("should show loading state on protected route without immediate redirect", () => {
    cy.visit("/dashboard");
    // Should show loading spinner first, not immediately redirect
    cy.get(".animate-spin").should("exist");
  });

  it("should redirect to login after loading on protected route", () => {
    cy.visit("/dashboard");
    // Wait for the auth check to complete
    cy.url({ timeout: 10000 }).should("include", "/login");
  });

  it("should redirect to login for my-bookings when not authenticated", () => {
    cy.visit("/my-bookings");
    cy.url({ timeout: 10000 }).should("include", "/login");
  });
});

describe("Driver Application Flow", () => {
  it("should display driver registration option", () => {
    cy.visit("/register?role=driver");
    // Driver should be pre-selected
    cy.get("button").contains("سائق").parent().should("have.class", "border-primary");
  });

  it("should show driver pending page structure", () => {
    // This tests the UI structure without authentication
    cy.visit("/driver/pending");
    // Should redirect to login since not authenticated
    cy.url({ timeout: 10000 }).should("include", "/login");
  });
});
