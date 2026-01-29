import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";
import type { Trip, Reservation } from "./useTrips";

export function useDriverTrips() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["driver-trips", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("trips")
        .select(`
          *,
          cars (name, plate_number, capacity)
        `)
        .eq("driver_id", user.id)
        .order("trip_date", { ascending: true })
        .order("departure_time", { ascending: true });

      if (error) throw error;
      return data as Trip[];
    },
    enabled: !!user,
  });
}

export function useDriverTripQueue(tripId: string) {
  return useQuery({
    queryKey: ["driver-queue", tripId],
    queryFn: async () => {
      if (!tripId) return [];

      // Get reservations for this trip
      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select("*")
        .eq("trip_id", tripId)
        .in("status", ["pending", "confirmed", "completed"])
        .order("queue_position", { ascending: true });

      if (resError) throw resError;
      if (!reservations) return [];

      // Get profile phone numbers only (for privacy)
      const userIds = reservations.map((r) => r.user_id);
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, name, phone")
        .in("id", userIds);

      if (profError) throw profError;

      const profileMap = new Map(profiles?.map((p) => [p.id, { name: p.name, phone: p.phone }]) || []);
      return reservations.map((r) => ({
        ...r,
        profiles: profileMap.get(r.user_id) || { name: "راكب", phone: "غير متوفر" },
      })) as Reservation[];
    },
    enabled: !!tripId,
  });
}

export function useMarkPassengerComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "completed" })
        .eq("id", reservationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-queue"] });
      toast({
        title: "تم ✓",
        description: "تم تسجيل وصول الراكب",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRatePassenger() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reservationId,
      passengerId,
      rating,
    }: {
      reservationId: string;
      passengerId: string;
      rating: number;
    }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      const { error } = await supabase
        .from("passenger_ratings")
        .insert({
          driver_id: user.id,
          passenger_id: passengerId,
          reservation_id: reservationId,
          rating,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-queue"] });
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
