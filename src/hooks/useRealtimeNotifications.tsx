import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Subscribe to reservation changes for this user
    const reservationChannel = supabase
      .channel(`reservations-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reservations",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newData = payload.new as { status: string; payment_status: string };
          const oldData = payload.old as { status: string; payment_status: string };

          // Payment confirmed notification
          if (oldData.payment_status !== "confirmed" && newData.payment_status === "confirmed") {
            toast({
              title: "تم تأكيد الدفع! 💰",
              description: "تم التحقق من دفعتك وتأكيد حجزك",
            });
          }

          // Reservation confirmed notification
          if (oldData.status !== "confirmed" && newData.status === "confirmed") {
            toast({
              title: "تم تأكيد الحجز! 🎉",
              description: "حجزك اتأكد. استعد للرحلة!",
            });
          }

          // Reservation cancelled notification
          if (oldData.status !== "cancelled" && newData.status === "cancelled") {
            toast({
              title: "تم إلغاء الحجز",
              description: "للأسف تم إلغاء حجزك",
              variant: "destructive",
            });
          }

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["reservations"] });
        }
      )
      .subscribe();

    // Subscribe to queue position changes (all reservations for trips user is in)
    const queueChannel = supabase
      .channel("queue-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
        },
        () => {
          // Refresh queue data when any reservation changes
          queryClient.invalidateQueries({ queryKey: ["reservations", "queue"] });
        }
      )
      .subscribe();

    // Subscribe to trip status changes
    const tripChannel = supabase
      .channel("trip-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trips",
        },
        (payload) => {
          const newData = payload.new as { status: string };
          
          if (newData.status === "in_progress") {
            toast({
              title: "الرحلة بدأت! 🚌",
              description: "السائق في الطريق",
            });
          }

          queryClient.invalidateQueries({ queryKey: ["trips"] });
        }
      )
      .subscribe();

    // Subscribe to vote count changes
    const voteChannel = supabase
      .channel("vote-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["votes"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservationChannel);
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(tripChannel);
      supabase.removeChannel(voteChannel);
    };
  }, [user, queryClient]);
}

// Hook for driver-specific notifications
export function useDriverRealtimeNotifications() {
  const { user, isDriver } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !isDriver) return;

    // Subscribe to new reservations for driver's trips
    const driverChannel = supabase
      .channel(`driver-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reservations",
        },
        () => {
          toast({
            title: "حجز جديد! 📥",
            description: "راكب جديد حجز في رحلتك",
          });
          queryClient.invalidateQueries({ queryKey: ["driver-queue"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(driverChannel);
    };
  }, [user, isDriver, queryClient]);
}

// Hook for admin notifications
export function useAdminRealtimeNotifications() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAdmin) return;

    // Subscribe to votes for 14+ threshold notifications
    const adminVoteChannel = supabase
      .channel("admin-votes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
        },
        async (payload) => {
          const tripId = (payload.new as { trip_id: string }).trip_id;
          
          // Check vote count
          const { count } = await supabase
            .from("votes")
            .select("*", { count: "exact", head: true })
            .eq("trip_id", tripId);

          if (count && count >= 14) {
            toast({
              title: "🚨 ١٤ صوت لعربية إضافية!",
              description: "رحلة وصلت ١٤ صوت. يجب إضافة عربية جديدة.",
            });
          }

          queryClient.invalidateQueries({ queryKey: ["admin", "votes"] });
        }
      )
      .subscribe();

    // Subscribe to new reservations needing payment confirmation
    const adminReservationChannel = supabase
      .channel("admin-reservations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reservations",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin", "reservations"] });
        }
      )
      .subscribe();

    // Subscribe to new driver registrations
    const adminDriverChannel = supabase
      .channel("admin-drivers")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "driver_profiles",
        },
        () => {
          toast({
            title: "سائق جديد! 🚗",
            description: "سائق جديد سجل ومحتاج موافقة",
          });
          queryClient.invalidateQueries({ queryKey: ["admin", "drivers"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(adminVoteChannel);
      supabase.removeChannel(adminReservationChannel);
      supabase.removeChannel(adminDriverChannel);
    };
  }, [isAdmin, queryClient]);
}
