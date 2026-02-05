import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-setup-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AdminCreateRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SETUP_ADMIN_TOKEN = Deno.env.get("SETUP_ADMIN_TOKEN");

    // Verify setup token
    const setupToken = req.headers.get("x-setup-admin-token");
    
    if (!SETUP_ADMIN_TOKEN) {
      return new Response(
        JSON.stringify({ error: "SETUP_ADMIN_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (setupToken !== SETUP_ADMIN_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Invalid setup token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: AdminCreateRequest = await req.json();

    // Validate input
    if (!body.email || !body.password || !body.name || !body.phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password, name, phone" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength
    if (body.password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate Egyptian phone
    const phoneRegex = /^(\+20|0)[1-9][0-9]{9}$/;
    if (!phoneRegex.test(body.phone.replace(/\s/g, ""))) {
      return new Response(
        JSON.stringify({ error: "Invalid Egyptian phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service client
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create user with admin metadata
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm admin email
      user_metadata: {
        name: body.name,
        phone: body.phone,
        role: "admin",
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // The handle_new_user trigger will create profile and passenger role
    // We need to add admin role
    const { error: roleError } = await serviceClient
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (roleError) {
      console.error("Role error:", roleError);
      // Don't fail - user was created, role can be added manually
    }

    // Log the action
    await serviceClient
      .from("audit_logs")
      .insert({
        table_name: "user_roles",
        action: "admin_created",
        record_id: userId,
        new_data: { email: body.email, name: body.name },
      });

    console.log("Admin created:", { userId, email: body.email });

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        message: "Admin account created successfully",
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in admin-create:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
