import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

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
  driver_profile?: {
    name: string;
  };
}

export interface Reservation {
  id: string;
  trip_id: string;
  user_id: string;
  seats_count: number;
  queue_position: number;
  payment_status: string;
  payment_proof_url: string | null;
  payment_transaction_id: string | null;
  status: string;
  created_at: string;
  profiles?: {
    name: string;
    phone: string;
  };
  trips?: Trip;
}

export function useAvailableTrips(origin?: string, destination?: string) {
  return useQuery({
    queryKey: ["trips", "available", origin, destination],
    queryFn: async () => {
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
      if (error) throw error;
      return data as Trip[];
    },
  });
}

export function useMyReservations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["reservations", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          trips (
            *,
            cars (name, plate_number, capacity)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Reservation[];
    },
    enabled: !!user,
  });
}

export function useTripQueue(tripId: string) {
  return useQuery({
    queryKey: ["reservations", "queue", tripId],
    queryFn: async () => {
      // First get reservations
      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select("*")
        .eq("trip_id", tripId)
        .in("status", ["pending", "confirmed"])
        .order("queue_position", { ascending: true });

      if (resError) throw resError;
      if (!reservations) return [];

      // Then get profiles for each reservation
      const userIds = reservations.map((r) => r.user_id);
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, name, phone")
        .in("id", userIds);

      if (profError) throw profError;

      // Combine the data
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      return reservations.map((r) => ({
        ...r,
        profiles: profileMap.get(r.user_id) || { name: "مستخدم", phone: "" },
      })) as Reservation[];
    },
    enabled: !!tripId,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      tripId,
      seatsCount,
      paymentProofUrl,
      paymentTransactionId,
    }: {
      tripId: string;
      seatsCount: number;
      paymentProofUrl?: string;
      paymentTransactionId?: string;
    }) => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");

      // Get current queue position
      const { count } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("trip_id", tripId);

      const queuePosition = (count ?? 0) + 1;

      const { data, error } = await supabase
        .from("reservations")
        .insert({
          trip_id: tripId,
          user_id: user.id,
          seats_count: seatsCount,
          queue_position: queuePosition,
          payment_proof_url: paymentProofUrl,
          payment_transaction_id: paymentTransactionId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast({
        title: "تم الحجز بنجاح! 🎉",
        description: "هيتم مراجعة الدفع وتأكيد حجزك",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الحجز",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      toast({
        title: "تم إلغاء الحجز",
        description: "تم إلغاء حجزك بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الإلغاء",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useVoteForExtraCar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tripId: string) => {
      if (!user) throw new Error("يجب تسجيل الدخول أولاً");

      const { data, error } = await supabase
        .from("votes")
        .insert({
          trip_id: tripId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("أنت صوّت قبل كده");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes"] });
      toast({
        title: "تم التصويت! 🗳️",
        description: "صوتك اتسجل. لما نوصل ١٤ صوت هنضيف عربية جديدة",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل التصويت",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useTripVotes(tripId: string) {
  return useQuery({
    queryKey: ["votes", tripId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .eq("trip_id", tripId);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!tripId,
  });
}
