import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PublicStats {
  totalStudents: number;
  approvedDrivers: number;
  completedTrips: number;
  averageRating: number;
}

export function usePublicStats() {
  return useQuery({
    queryKey: ["public-stats"],
    queryFn: async (): Promise<PublicStats> => {
      // Get total passengers (users with passenger role)
      const { count: passengersCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "passenger");

      // Get approved drivers count
      const { count: driversCount } = await supabase
        .from("driver_profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", true);

      // Get completed trips count
      const { count: tripsCount } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      // Get average rating from passenger_ratings
      const { data: ratings } = await supabase
        .from("passenger_ratings")
        .select("rating");

      let avgRating = 0;
      if (ratings && ratings.length > 0) {
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        avgRating = sum / ratings.length;
      }

      return {
        totalStudents: passengersCount || 0,
        approvedDrivers: driversCount || 0,
        completedTrips: tripsCount || 0,
        averageRating: avgRating || 0,
      };
    },
    staleTime: 60000, // Cache for 1 minute
  });
}
