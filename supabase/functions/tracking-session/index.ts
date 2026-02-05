import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Get trip_id from URL params
    const url = new URL(req.url);
    const trip_id = url.searchParams.get("trip_id");
    
    if (!trip_id) {
      return new Response(JSON.stringify({ error: "trip_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for admin checks
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user is admin
    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin"
    });

    // Check if user is driver of this trip
    const { data: trip } = await serviceClient
      .from("trips")
      .select("driver_id")
      .eq("id", trip_id)
      .single();

    const isDriver = trip?.driver_id === userId;

    // Check if user has confirmed booking for this trip
    const { data: hasConfirmedBooking } = await serviceClient
      .from("reservations")
      .select("id")
      .eq("trip_id", trip_id)
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .single();

    if (!isAdmin && !isDriver && !hasConfirmedBooking) {
      return new Response(JSON.stringify({ error: "Not authorized to view tracking" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active session for this trip
    const { data: session, error: sessionError } = await serviceClient
      .from("driver_tracking_sessions")
      .select("id, started_at, status")
      .eq("trip_id", trip_id)
      .eq("status", "active")
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ 
        active: false,
        message: "No active tracking session" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get latest position
    const { data: latestPosition } = await serviceClient
      .from("driver_positions")
      .select("lat, lng, sent_at, speed_m_s")
      .eq("session_id", session.id)
      .order("sent_at", { ascending: false })
      .limit(1)
      .single();

    return new Response(JSON.stringify({
      active: true,
      session_id: session.id,
      started_at: session.started_at,
      last_position: latestPosition ? {
        lat: latestPosition.lat,
        lng: latestPosition.lng,
        sent_at: latestPosition.sent_at,
        speed_m_s: latestPosition.speed_m_s,
      } : null,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
