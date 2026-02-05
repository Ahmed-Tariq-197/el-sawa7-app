import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SMSTestRequest {
  to: string;
  message: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SMS_TEST_MODE = Deno.env.get("SMS_TEST_MODE") !== "false"; // Default true

    // Authenticate request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Check if user is admin
    const { data: adminRole } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Forbidden - admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, message }: SMSTestRequest = await req.json();

    // Validate input
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate message length
    if (typeof message !== "string" || message.length > 1600) {
      return new Response(
        JSON.stringify({ error: "Message must be max 1600 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate Egyptian phone number
    const cleanPhone = to.replace(/\s/g, "");
    const egyptianPhoneRegex = /^(\+20|0)[1-9][0-9]{9}$/;
    
    if (!egyptianPhoneRegex.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: "Invalid Egyptian phone number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+20" + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+20" + formattedPhone;
    }

    // Create service client for logging
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let status = "sent";
    let errorMessage: string | null = null;
    let messageSid: string | null = null;

    if (SMS_TEST_MODE) {
      // Mock mode - simulate Twilio magic numbers
      console.log(`[TEST MODE] Would send SMS to ${formattedPhone}: ${message}`);
      
      // Use Twilio magic numbers for testing
      if (formattedPhone.includes("5005550006")) {
        status = "sent";
        messageSid = `TEST_${Date.now()}`;
      } else if (formattedPhone.includes("5005550001")) {
        status = "failed";
        errorMessage = "Invalid phone number";
      } else {
        status = "sent";
        messageSid = `TEST_${Date.now()}`;
      }
    } else {
      // Real SMS sending via Twilio
      const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
      const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
      const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        return new Response(
          JSON.stringify({ error: "Twilio credentials not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const twilioAuthHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

      try {
        const response = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${twilioAuthHeader}`,
          },
          body: new URLSearchParams({
            To: formattedPhone,
            From: TWILIO_PHONE_NUMBER,
            Body: message,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          status = "failed";
          errorMessage = result.message || "Failed to send SMS";
        } else {
          status = "sent";
          messageSid = result.sid;
        }
      } catch (twilioError) {
        status = "failed";
        errorMessage = String(twilioError);
      }
    }

    // Log to sms_logs table
    await serviceClient
      .from("sms_logs")
      .insert({
        recipient_phone: formattedPhone,
        message: message.substring(0, 500), // Truncate for storage
        status,
        error_message: errorMessage,
        test_mode: SMS_TEST_MODE,
      });

    console.log(`SMS ${SMS_TEST_MODE ? "[TEST]" : ""} sent by admin ${userId} to ${formattedPhone}: ${status}`);

    return new Response(
      JSON.stringify({
        success: status === "sent",
        testMode: SMS_TEST_MODE,
        messageSid,
        error: errorMessage,
      }),
      { status: status === "sent" ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in sms-test:", error);
    return new Response(
      JSON.stringify({ error: "حصل خطأ" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
