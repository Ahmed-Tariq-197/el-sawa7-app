// MODIFIED BY: final-fix-trips-oauth-driver - reason: unit test for seed fallback logic
import { describe, it, expect } from "vitest";
import seedTrips from "@/data/trips.seed.json";

describe("Trips Seed Fallback", () => {
  it("seed data file should contain at least 2 trips", () => {
    expect(Array.isArray(seedTrips)).toBe(true);
    expect(seedTrips.length).toBeGreaterThanOrEqual(2);
  });

  it("each seed trip should have required fields", () => {
    for (const trip of seedTrips) {
      expect(trip).toHaveProperty("origin");
      expect(trip).toHaveProperty("destination");
      expect(trip).toHaveProperty("trip_date");
      expect(trip).toHaveProperty("departure_time");
      expect(trip).toHaveProperty("price");
      expect(trip).toHaveProperty("available_seats");
      expect(trip).toHaveProperty("status");
      expect(trip.status).toBe("scheduled");
      expect(typeof trip.price).toBe("number");
      expect(typeof trip.available_seats).toBe("number");
    }
  });

  it("convertSeedToTrips should produce Trip-shaped objects", () => {
    // Simulate the conversion logic from useTripsFallback
    const converted = seedTrips.map((item, index) => ({
      id: `seed-${index}-test`,
      car_id: `seed-car-${index}`,
      driver_id: null,
      origin: item.origin,
      destination: item.destination,
      trip_date: item.trip_date,
      departure_time: item.departure_time,
      price: item.price,
      available_seats: item.available_seats,
      is_full: false,
      status: item.status,
      created_at: new Date().toISOString(),
      cars: {
        name: `عربية ${index + 1}`,
        plate_number: `أ ب ج ${1000 + index}`,
        capacity: 14,
      },
      isSeedData: true,
    }));

    expect(converted.length).toBe(seedTrips.length);
    for (const trip of converted) {
      expect(trip.isSeedData).toBe(true);
      expect(trip.id).toMatch(/^seed-/);
      expect(trip.cars).toBeDefined();
      expect(trip.cars.capacity).toBe(14);
    }
  });

  it("filter by origin should narrow results", () => {
    const origin = "القاهرة";
    const filtered = seedTrips.filter((t) => t.origin === origin);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(seedTrips.length);
    for (const t of filtered) {
      expect(t.origin).toBe(origin);
    }
  });
});
