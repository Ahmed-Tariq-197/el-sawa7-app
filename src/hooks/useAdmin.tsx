import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface AdminStats {
  totalPassengers: number;
  totalDrivers: number;
  pendingReservations: number;
  confirmedReservations: number;
  activeTrips: number;
  pendingDriverApprovals: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      // Get counts in parallel
      const [
        passengersRes,
        driversRes,
        pendingReservationsRes,
        confirmedReservationsRes,
        activeTripsRes,
        pendingDriversRes,
      ] = await Promise.all([
        supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "passenger"),
        supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "driver"),
        supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("payment_status", "pending"),
        supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("payment_status", "confirmed"),
        supabase
          .from("trips")
          .select("*", { count: "exact", head: true })
          .eq("status", "scheduled"),
        supabase
          .from("driver_profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_approved", false),
      ]);

      return {
        totalPassengers: passengersRes.count ?? 0,
        totalDrivers: driversRes.count ?? 0,
        pendingReservations: pendingReservationsRes.count ?? 0,
        confirmedReservations: confirmedReservationsRes.count ?? 0,
        activeTrips: activeTripsRes.count ?? 0,
        pendingDriverApprovals: pendingDriversRes.count ?? 0,
      } as AdminStats;
    },
  });
}

export function useAdminReservations(status?: string) {
  return useQuery({
    queryKey: ["admin", "reservations", status],
    queryFn: async () => {
      let query = supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("payment_status", status);
      }

      const { data: reservations, error } = await query;
      if (error) throw error;

      // Get related data
      const tripIds = [...new Set(reservations?.map((r) => r.trip_id) || [])];
      const userIds = [...new Set(reservations?.map((r) => r.user_id) || [])];

      const [tripsRes, profilesRes] = await Promise.all([
        supabase
          .from("trips")
          .select("*, cars(name, plate_number)")
          .in("id", tripIds.length > 0 ? tripIds : ["none"]),
        supabase
          .from("profiles")
          .select("*")
          .in("id", userIds.length > 0 ? userIds : ["none"]),
      ]);

      const tripMap = new Map(tripsRes.data?.map((t) => [t.id, t]) || []);
      const profileMap = new Map(profilesRes.data?.map((p) => [p.id, p]) || []);

      return reservations?.map((r) => ({
        ...r,
        trip: tripMap.get(r.trip_id),
        profile: profileMap.get(r.user_id),
      }));
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from("reservations")
        .update({
          payment_status: "confirmed",
          status: "confirmed",
        })
        .eq("id", reservationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({
        title: "تم تأكيد الدفع ✅",
        description: "تم تأكيد الحجز بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل التأكيد",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRejectPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const { error } = await supabase
        .from("reservations")
        .update({
          payment_status: "rejected",
          status: "cancelled",
        })
        .eq("id", reservationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({
        title: "تم رفض الدفع",
        description: "تم إلغاء الحجز",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الرفض",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAdminDrivers() {
  return useQuery({
    queryKey: ["admin", "drivers"],
    queryFn: async () => {
      const { data: driverProfiles, error } = await supabase
        .from("driver_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = driverProfiles?.map((d) => d.user_id) || [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds.length > 0 ? userIds : ["none"]);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return driverProfiles?.map((d) => ({
        ...d,
        profile: profileMap.get(d.user_id),
      }));
    },
  });
}

export function useApproveDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (driverProfileId: string) => {
      // First, get the user_id from the driver profile
      const { data: driverProfile, error: fetchError } = await supabase
        .from("driver_profiles")
        .select("user_id")
        .eq("id", driverProfileId)
        .single();

      if (fetchError || !driverProfile) {
        throw new Error("فشل في العثور على بيانات السائق");
      }

      // Update driver_profiles to set is_approved = true
      const { error: updateError } = await supabase
        .from("driver_profiles")
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
        })
        .eq("id", driverProfileId);

      if (updateError) throw updateError;

      // Add driver role to user_roles table (upsert to avoid duplicates)
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: driverProfile.user_id, role: "driver" as const },
          { onConflict: "user_id,role" }
        );

      if (roleError) {
        console.error("Error adding driver role:", roleError);
        // Don't throw - driver profile is already approved, role add is secondary
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "drivers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({
        title: "تم قبول السائق ✅",
        description: "السائق أصبح نشط الآن ويمكنه استلام رحلات",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل القبول",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAdminCars() {
  return useQuery({
    queryKey: ["admin", "cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (car: {
      name: string;
      plate_number: string;
      capacity: number;
      region: string;
    }) => {
      const { data, error } = await supabase
        .from("cars")
        .insert(car)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cars"] });
      toast({
        title: "تمت إضافة العربية 🚌",
        description: "تم إضافة العربية بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الإضافة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAdminTrips() {
  return useQuery({
    queryKey: ["admin", "trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*, cars(name, plate_number)")
        .order("trip_date", { ascending: true })
        .order("departure_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trip: {
      car_id: string;
      driver_id?: string;
      origin: string;
      destination: string;
      trip_date: string;
      departure_time: string;
      price: number;
      available_seats: number;
    }) => {
      const { data, error } = await supabase
        .from("trips")
        .insert(trip)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "trips"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast({
        title: "تمت إضافة الرحلة 🚀",
        description: "تم إضافة الرحلة بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل الإضافة",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
