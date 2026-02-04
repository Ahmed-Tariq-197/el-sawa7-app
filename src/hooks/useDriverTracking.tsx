import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

const MIN_TRACKING_INTERVAL_MS = 3000; // 3 seconds
const MIN_DISTANCE_METERS = 10; // Only send if moved > 10m
const MAX_ACCURACY_METERS = 200;

interface Position {
  lat: number;
  lng: number;
  accuracy_m?: number;
  speed_m_s?: number;
  sent_at: string;
}

interface TrackingSession {
  session_id: string;
  started_at: string;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function useDriverTrackingSession(tripId: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [activeSession, setActiveSession] = useState<TrackingSession | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("tracking-start", {
        body: { trip_id: tripId },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data as TrackingSession;
    },
    onSuccess: (data) => {
      setActiveSession(data);
      setIsTracking(true);
      toast({
        title: "تم بدء مشاركة الموقع 📍",
        description: "الركاب يقدروا يتتبعوا موقعك دلوقتي",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل بدء التتبع",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession?.session_id) throw new Error("No active session");

      const response = await supabase.functions.invoke("tracking-end", {
        body: { session_id: activeSession.session_id },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: () => {
      setActiveSession(null);
      setIsTracking(false);
      stopWatching();
      toast({
        title: "تم إيقاف مشاركة الموقع",
        description: "الركاب مش هيشوفوا موقعك دلوقتي",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل إيقاف التتبع",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendPositionMutation = useMutation({
    mutationFn: async (position: GeolocationPosition) => {
      if (!activeSession?.session_id) return;

      const { latitude: lat, longitude: lng, accuracy, speed } = position.coords;

      // Validate coordinate ranges
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.log("Skipping position - invalid coordinates:", lat, lng);
        return;
      }

      // Skip if accuracy is too poor
      if (accuracy && accuracy > MAX_ACCURACY_METERS) {
        console.log("Skipping position - accuracy too low:", accuracy);
        return;
      }

      // Skip if haven't moved enough
      if (lastPositionRef.current) {
        const distance = calculateDistance(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          lat,
          lng
        );
        if (distance < MIN_DISTANCE_METERS) {
          console.log("Skipping position - distance too small:", distance);
          return;
        }
      }

      const response = await supabase.functions.invoke("tracking-position", {
        body: {
          session_id: activeSession.session_id,
          lat,
          lng,
          accuracy_m: accuracy || null,
          speed_m_s: speed || null,
        },
      });

      if (response.error) {
        // Handle rate limiting silently
        if (response.error.message?.includes("429")) {
          console.log("Rate limited, will retry");
          return;
        }
        throw new Error(response.error.message);
      }

      lastPositionRef.current = { lat, lng };
    },
  });

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "الموقع غير مدعوم",
        description: "المتصفح لا يدعم تحديد الموقع",
        variant: "destructive",
      });
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        sendPositionMutation.mutate(position);
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          toast({
            title: "صلاحية الموقع مرفوضة",
            description: "لازم تسمح بالوصول للموقع",
            variant: "destructive",
          });
          endSessionMutation.mutate();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: MIN_TRACKING_INTERVAL_MS,
      }
    );
  }, [activeSession?.session_id]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startTracking = useCallback(async () => {
    await startSessionMutation.mutateAsync();
    startWatching();
  }, [startSessionMutation, startWatching]);

  const stopTracking = useCallback(async () => {
    stopWatching();
    await endSessionMutation.mutateAsync();
  }, [endSessionMutation, stopWatching]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    isTracking,
    activeSession,
    startTracking,
    stopTracking,
    isStarting: startSessionMutation.isPending,
    isStopping: endSessionMutation.isPending,
  };
}

// Hook for passengers to view driver location
export function usePassengerTracking(tripId: string) {
  const { session } = useAuth();
  const [lastPosition, setLastPosition] = useState<Position | null>(null);

  const { data: trackingSession, isLoading } = useQuery({
    queryKey: ["tracking-session", tripId],
    queryFn: async () => {
      const response = await supabase.functions.invoke("tracking-session", {
        body: null,
        method: "GET",
        headers: {},
      });
      
      // Use fetch directly for GET with query params
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tracking-session?trip_id=${tripId}`;
      const fetchResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!fetchResponse.ok) {
        if (fetchResponse.status === 403) return null;
        throw new Error("Failed to fetch tracking session");
      }

      return fetchResponse.json();
    },
    enabled: !!tripId && !!session?.access_token,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  useEffect(() => {
    if (trackingSession?.last_position) {
      setLastPosition(trackingSession.last_position);
    }
  }, [trackingSession]);

  return {
    isActive: trackingSession?.active ?? false,
    sessionId: trackingSession?.session_id ?? null,
    lastPosition,
    isLoading,
  };
}

// Calculate simple ETA using Haversine + average speed
export function calculateETA(
  driverLat: number,
  driverLng: number,
  destinationLat: number,
  destinationLng: number,
  speedMs?: number | null
): number | null {
  const distance = calculateDistance(driverLat, driverLng, destinationLat, destinationLng);
  const avgSpeedMs = speedMs || 8.33; // Default ~30 km/h in urban areas
  const etaSeconds = distance / avgSpeedMs;
  return Math.round(etaSeconds / 60); // Return minutes
}
