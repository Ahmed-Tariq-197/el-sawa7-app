import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration
const MIN_TRACKING_INTERVAL_SECONDS = parseInt(Deno.env.get("MIN_TRACKING_INTERVAL_SECONDS") || "3");
const MAX_ACCURACY_METERS = parseInt(Deno.env.get("MAX_ACCURACY_METERS") || "200");

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

    const { session_id, lat, lng, accuracy_m, speed_m_s } = await req.json();

    if (!session_id || lat === undefined || lng === undefined) {
      return new Response(JSON.stringify({ error: "session_id, lat, and lng are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate coordinate ranges
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return new Response(JSON.stringify({ error: "Invalid coordinates" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate accuracy (must be non-negative and within reasonable bounds)
    if (accuracy_m !== undefined && accuracy_m !== null) {
      if (typeof accuracy_m !== "number" || accuracy_m < 0 || accuracy_m > MAX_ACCURACY_METERS) {
        return new Response(JSON.stringify({ error: "Position accuracy too low, ignoring" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Validate speed (must be non-negative and reasonable - max 200 km/h = ~55 m/s)
    const MAX_SPEED_M_S = 55;
    if (speed_m_s !== undefined && speed_m_s !== null) {
      if (typeof speed_m_s !== "number" || speed_m_s < 0 || speed_m_s > MAX_SPEED_M_S) {
        return new Response(JSON.stringify({ error: "Invalid speed value" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Verify session belongs to driver and is active
    const { data: session, error: sessionError } = await supabase
      .from("driver_tracking_sessions")
      .select("id, driver_id, status")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.driver_id !== userId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.status !== "active") {
      return new Response(JSON.stringify({ error: "Session is not active" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting: Check last position timestamp
    const { data: lastPosition } = await supabase
      .from("driver_positions")
      .select("sent_at")
      .eq("session_id", session_id)
      .order("sent_at", { ascending: false })
      .limit(1)
      .single();

    if (lastPosition) {
      const lastTime = new Date(lastPosition.sent_at).getTime();
      const now = Date.now();
      const diffSeconds = (now - lastTime) / 1000;

      if (diffSeconds < MIN_TRACKING_INTERVAL_SECONDS) {
        return new Response(JSON.stringify({ 
          error: "Rate limited",
          retry_after: MIN_TRACKING_INTERVAL_SECONDS - diffSeconds 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Insert position
    const { error: insertError } = await supabase
      .from("driver_positions")
      .insert({
        session_id,
        lat,
        lng,
        accuracy_m: accuracy_m || null,
        speed_m_s: speed_m_s || null,
      });

    if (insertError) {
      console.error("Position insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save position" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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
