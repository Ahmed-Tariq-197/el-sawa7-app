/// <reference types="cypress" />

describe("Privacy Tests", () => {
  describe("Passenger Queue View", () => {
    it("should show passenger names but not phone numbers in queue", () => {
      // This test verifies that the passenger_queue_view function 
      // returns names but not phone numbers
      
      cy.visit("/trips");
      cy.get(".animate-spin").should("not.exist", { timeout: 10000 });
      
      // If there are trips with bookings, verify phone numbers are not visible
      cy.get("body").then(($body) => {
        // Phone number patterns should not be visible to passengers
        const phonePatterns = /01\d{9}|\+20\d{10}/g;
        const bodyText = $body.text();
        
        // Check that no Egyptian phone numbers are visible on public pages
        const matches = bodyText.match(phonePatterns);
        if (matches) {
          // Only the contact phone should be visible (01015556416)
          const contactPhone = "01015556416";
          matches.forEach((match: string) => {
            expect(match).to.equal(contactPhone);
          });
        }
      });
    });
  });

  describe("Profile Privacy", () => {
    it("should not expose user profiles on public pages", () => {
      cy.visit("/");
      
      // Public pages should not show user profile data
      cy.get("body").then(($body) => {
        // No email patterns should be visible (except contact email)
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const bodyText = $body.text();
        const matches = bodyText.match(emailPattern);
        
        if (matches) {
          // Only contact email should be visible
          matches.forEach((email: string) => {
            expect(email).to.equal("support@elsawa7.com");
          });
        }
      });
    });
  });

  describe("Driver Tracking Privacy", () => {
    it("should not show tracking data on public pages", () => {
      cy.visit("/");
      
      // Tracking data should not be visible without authentication
      cy.contains("السواق دلوقتي").should("not.exist");
      cy.contains("مباشر").should("not.exist");
    });
  });
});
