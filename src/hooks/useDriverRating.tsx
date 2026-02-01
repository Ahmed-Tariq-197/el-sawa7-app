import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DriverRatingStats {
  averageRating: number;
  totalRatings: number;
}

export function useDriverRating(driverId: string | undefined) {
  return useQuery({
    queryKey: ["driver-rating", driverId],
    queryFn: async (): Promise<DriverRatingStats> => {
      if (!driverId) {
        return { averageRating: 0, totalRatings: 0 };
      }

      const { data, error } = await supabase
        .from("passenger_ratings")
        .select("rating")
        .eq("driver_id", driverId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { averageRating: 0, totalRatings: 0 };
      }

      const total = data.reduce((sum, r) => sum + r.rating, 0);
      const average = total / data.length;

      return {
        averageRating: Math.round(average * 10) / 10,
        totalRatings: data.length,
      };
    },
    enabled: !!driverId,
  });
}

export function useHasRatedReservation(reservationId: string | undefined) {
  return useQuery({
    queryKey: ["has-rated", reservationId],
    queryFn: async (): Promise<boolean> => {
      if (!reservationId) return false;

      const { data } = await supabase
        .from("passenger_ratings")
        .select("id")
        .eq("reservation_id", reservationId)
        .single();

      return !!data;
    },
    enabled: !!reservationId,
  });
}