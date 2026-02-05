import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import seedTrips from "@/data/trips.seed.json";

export interface Trip {
  id: string;
  car_id: string;
  driver_id: string | null;
  origin: string;
  destination: string;
  trip_date: string;
  departure_time: string;
  price: number;
  available_seats: number;
  is_full: boolean;
  status: string;
  created_at: string;
  cars?: {
    name: string;
    plate_number: string;
    capacity: number;
  };
  isSeedData?: boolean;
}

// Generate unique IDs for seed data
function generateSeedId(index: number): string {
  return `seed-${index}-${Date.now()}`;
}

// Convert seed data to Trip format
function convertSeedToTrips(seed: typeof seedTrips): Trip[] {
  return seed.map((item, index) => ({
    id: generateSeedId(index),
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
}

export function useAvailableTripsWithFallback(origin?: string, destination?: string) {
  return useQuery({
    queryKey: ["trips", "available-fallback", origin, destination],
    queryFn: async () => {
      // First try to get real trips
      let query = supabase
        .from("trips")
        .select(`
          *,
          cars (name, plate_number, capacity)
        `)
        .eq("status", "scheduled")
        .eq("is_full", false)
        .gte("trip_date", new Date().toISOString().split("T")[0])
        .order("trip_date", { ascending: true })
        .order("departure_time", { ascending: true });

      if (origin) {
        query = query.eq("origin", origin);
      }
      if (destination) {
        query = query.eq("destination", destination);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching trips:", error);
        throw error;
      }

      // If no real trips, use seed data as fallback
      if (!data || data.length === 0) {
        console.log("No trips found, using seed data fallback");
        let seedData = convertSeedToTrips(seedTrips);
        
        // Apply filters to seed data
        if (origin) {
          seedData = seedData.filter(t => t.origin === origin);
        }
        if (destination) {
          seedData = seedData.filter(t => t.destination === destination);
        }
        
        return {
          trips: seedData,
          isSeedData: true,
        };
      }

      return {
        trips: data as Trip[],
        isSeedData: false,
      };
    },
  });
}

// Hook to check if we're in dev/test mode
export function useIsDevMode() {
  return import.meta.env.DEV || import.meta.env.MODE === "development";
}
