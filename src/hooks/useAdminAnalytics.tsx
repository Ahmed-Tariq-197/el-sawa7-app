import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";

export interface DailyReservationData {
  date: string;
  count: number;
  confirmed: number;
  pending: number;
}

export interface TripVotesData {
  tripId: string;
  origin: string;
  destination: string;
  votes: number;
}

export interface RegionData {
  region: string;
  trips: number;
  reservations: number;
}

export function useReservationTrends(days: number = 14) {
  return useQuery({
    queryKey: ["admin", "analytics", "reservations", days],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("reservations")
        .select("created_at, payment_status")
        .gte("created_at", startDate)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by day
      const dailyData: Record<string, DailyReservationData> = {};
      
      // Initialize all days
      for (let i = days; i >= 0; i--) {
        const date = format(subDays(new Date(), i), "yyyy-MM-dd");
        dailyData[date] = {
          date: format(subDays(new Date(), i), "dd MMM", { locale: ar }),
          count: 0,
          confirmed: 0,
          pending: 0,
        };
      }

      // Fill in data
      data?.forEach((reservation) => {
        const date = format(new Date(reservation.created_at), "yyyy-MM-dd");
        if (dailyData[date]) {
          dailyData[date].count++;
          if (reservation.payment_status === "confirmed") {
            dailyData[date].confirmed++;
          } else if (reservation.payment_status === "pending") {
            dailyData[date].pending++;
          }
        }
      });

      return Object.values(dailyData);
    },
  });
}

export function useTopVotedTrips() {
  return useQuery({
    queryKey: ["admin", "analytics", "votes"],
    queryFn: async () => {
      // Get trips with vote counts
      const { data: trips, error: tripsError } = await supabase
        .from("trips")
        .select("id, origin, destination")
        .eq("status", "scheduled");

      if (tripsError) throw tripsError;

      // Get vote counts for each trip
      const tripIds = trips?.map((t) => t.id) || [];
      
      if (tripIds.length === 0) return [];

      const { data: votes, error: votesError } = await supabase
        .from("votes")
        .select("trip_id")
        .in("trip_id", tripIds);

      if (votesError) throw votesError;

      // Count votes per trip
      const voteCounts: Record<string, number> = {};
      votes?.forEach((v) => {
        voteCounts[v.trip_id] = (voteCounts[v.trip_id] || 0) + 1;
      });

      // Combine and sort
      const result: TripVotesData[] = trips
        ?.map((trip) => ({
          tripId: trip.id,
          origin: trip.origin,
          destination: trip.destination,
          votes: voteCounts[trip.id] || 0,
        }))
        .filter((t) => t.votes > 0)
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 10) || [];

      return result;
    },
  });
}

export function useRegionStats() {
  return useQuery({
    queryKey: ["admin", "analytics", "regions"],
    queryFn: async () => {
      // Get cars with regions
      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select("id, region");

      if (carsError) throw carsError;

      // Get trips for these cars
      const { data: trips, error: tripsError } = await supabase
        .from("trips")
        .select("id, car_id");

      if (tripsError) throw tripsError;

      // Get reservations for these trips
      const tripIds = trips?.map((t) => t.id) || [];
      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select("trip_id")
        .in("trip_id", tripIds.length > 0 ? tripIds : ["none"]);

      if (resError) throw resError;

      // Build region stats
      const carRegionMap = new Map(cars?.map((c) => [c.id, c.region]) || []);
      const tripCarMap = new Map(trips?.map((t) => [t.id, t.car_id]) || []);

      const regionStats: Record<string, RegionData> = {};

      // Count trips per region
      trips?.forEach((trip) => {
        const region = carRegionMap.get(trip.car_id) || "غير محدد";
        if (!regionStats[region]) {
          regionStats[region] = { region, trips: 0, reservations: 0 };
        }
        regionStats[region].trips++;
      });

      // Count reservations per region
      reservations?.forEach((res) => {
        const carId = tripCarMap.get(res.trip_id);
        const region = carRegionMap.get(carId || "") || "غير محدد";
        if (regionStats[region]) {
          regionStats[region].reservations++;
        }
      });

      return Object.values(regionStats).sort((a, b) => b.reservations - a.reservations);
    },
  });
}

export function useDriverPerformance() {
  return useQuery({
    queryKey: ["admin", "analytics", "drivers"],
    queryFn: async () => {
      const { data: drivers, error: driversError } = await supabase
        .from("driver_profiles")
        .select("user_id, rating, total_trips, is_approved")
        .eq("is_approved", true)
        .order("total_trips", { ascending: false })
        .limit(10);

      if (driversError) throw driversError;

      const userIds = drivers?.map((d) => d.user_id) || [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds.length > 0 ? userIds : ["none"]);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.name]) || []);

      return drivers?.map((d) => ({
        name: profileMap.get(d.user_id) || "سائق",
        trips: d.total_trips || 0,
        rating: d.rating || 0,
      })) || [];
    },
  });
}
