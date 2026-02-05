// Custom Cypress Commands

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.session(
    [email, password],
    () => {
      cy.visit("/login");
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.url().should("not.include", "/login");
    },
    {
      validate: () => {
        // Check if still logged in
        cy.window().its("localStorage").should("exist");
      },
    }
  );
});

Cypress.Commands.add("logout", () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
  cy.clearCookies();
  cy.visit("/");
});

Cypress.Commands.add("preserveSession", () => {
  Cypress.Cookies.preserveOnce("sb-access-token", "sb-refresh-token");
});

export {};
