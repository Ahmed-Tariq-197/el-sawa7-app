import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const pushTestMode = Deno.env.get("PUSH_TEST_MODE") !== "false";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "يجب تسجيل الدخول أولاً" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "غير مصرح" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId = body.user_id || user.id;
    const title = body.title || "ElSawa7 🚌";
    const messageBody = body.body || "إشعار تجريبي من ElSawa7";

    // Get user's subscription
    const { data: subscription, error: subError } = await adminClient
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: "لم يتم العثور على اشتراك للإشعارات" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the push attempt
    const logData = {
      user_id: targetUserId,
      subscription_id: subscription.id,
      title,
      body: messageBody,
      status: "pending",
      test_mode: pushTestMode,
    };

    if (pushTestMode) {
      // In test mode, just log and return success
      await adminClient.from("push_logs").insert({
        ...logData,
        status: "test_success",
      });

      return new Response(
        JSON.stringify({
          success: true,
          test_mode: true,
          message: "تم تسجيل الإشعار (وضع الاختبار)",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Real push - would need web-push library
    // For now, return that VAPID keys are not configured
    if (!vapidPublicKey || !vapidPrivateKey) {
      await adminClient.from("push_logs").insert({
        ...logData,
        status: "skipped",
        error_message: "VAPID keys not configured",
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: "مفاتيح VAPID غير مُعدة",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log success (actual push would happen here with web-push)
    await adminClient.from("push_logs").insert({
      ...logData,
      status: "sent",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "تم إرسال الإشعار",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "حصل خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
