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

    // Get session_id and limit from URL params
    const url = new URL(req.url);
    const session_id = url.searchParams.get("session_id");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    
    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for authorization checks
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get session info
    const { data: session, error: sessionError } = await serviceClient
      .from("driver_tracking_sessions")
      .select("id, trip_id, driver_id")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin"
    });

    // Check if user is the driver
    const isDriver = session.driver_id === userId;

    // Check if user has confirmed booking for this trip
    const { data: hasConfirmedBooking } = await serviceClient
      .from("reservations")
      .select("id")
      .eq("trip_id", session.trip_id)
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .single();

    if (!isAdmin && !isDriver && !hasConfirmedBooking) {
      return new Response(JSON.stringify({ error: "Not authorized to view positions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get positions
    const { data: positions, error: positionsError } = await serviceClient
      .from("driver_positions")
      .select("lat, lng, sent_at, speed_m_s, accuracy_m")
      .eq("session_id", session_id)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (positionsError) {
      console.error("Positions fetch error:", positionsError);
      return new Response(JSON.stringify({ error: "Failed to fetch positions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      positions: positions || [],
      count: positions?.length || 0,
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
