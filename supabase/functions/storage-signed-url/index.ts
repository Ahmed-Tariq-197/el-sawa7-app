import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SignedUrlRequest {
  bucket: string;
  path: string;
  expiresIn?: number; // seconds, default 60
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const body: SignedUrlRequest = await req.json();

    // Validate input
    if (!body.bucket || !body.path) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: bucket, path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize path
    const sanitizedPath = body.path.replace(/\.\./g, "").replace(/\/\//g, "/");

    // Check access permissions based on bucket
    let hasAccess = false;
    
    if (body.bucket === "payment-proofs") {
      // Only allow access to own files or admin
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();
      
      hasAccess = adminRole !== null || sanitizedPath.startsWith(`${userId}/`);
    } else if (body.bucket === "driver-documents") {
      // Only allow access to own files or admin
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();
      
      hasAccess = adminRole !== null || sanitizedPath.startsWith(`${userId}/`);
    } else if (body.bucket === "avatars") {
      // Public bucket - anyone can access
      hasAccess = true;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid bucket" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URL
    const expiresIn = Math.min(body.expiresIn || 60, 3600); // Max 1 hour
    
    const { data, error } = await supabase.storage
      .from(body.bucket)
      .createSignedUrl(sanitizedPath, expiresIn);

    if (error) {
      console.error("Signed URL error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate signed URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        signedUrl: data.signedUrl,
        expiresIn,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in storage-signed-url:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
