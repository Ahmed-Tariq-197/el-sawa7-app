import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotifyRequest {
  reservationId: string;
  type: "confirmed" | "cancelled" | "reminder";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    // Authentication check - require valid auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing auth header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with user's auth to verify identity
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Forbidden - admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role for actual operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

    const { reservationId, type }: NotifyRequest = await req.json();

    if (!reservationId || !type) {
      throw new Error("Missing required fields");
    }

    // Get reservation with user and trip info
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select(`
        *,
        trips (
          origin,
          destination,
          trip_date,
          departure_time,
          price
        )
      `)
      .eq("id", reservationId)
      .single();

    if (reservationError || !reservation) {
      throw new Error("Reservation not found");
    }

    // Get user profile and email
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", reservation.user_id)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(reservation.user_id);

    const userName = profile?.name || "مستخدم";
    const userPhone = profile?.phone;
    const userEmail = authUser?.user?.email;
    const trip = reservation.trips;

    // Build notification message
    let subject = "";
    let message = "";

    switch (type) {
      case "confirmed":
        subject = "✅ تم تأكيد حجزك في ElSawa7";
        message = `
مرحباً ${userName}!

تم تأكيد حجزك بنجاح 🎉

تفاصيل الرحلة:
📍 من: ${trip.origin}
📍 إلى: ${trip.destination}
📅 التاريخ: ${trip.trip_date}
⏰ الموعد: ${trip.departure_time}
💰 السعر: ${trip.price} ج.م
🎫 ترتيبك: #${reservation.queue_position}

شكراً لاختيارك ElSawa7!
للتواصل: 01015556416
        `.trim();
        break;

      case "cancelled":
        subject = "❌ تم إلغاء حجزك في ElSawa7";
        message = `
مرحباً ${userName}،

نأسف لإعلامك أن حجزك للرحلة من ${trip.origin} إلى ${trip.destination} يوم ${trip.trip_date} تم إلغاؤه.

للمزيد من المعلومات تواصل معنا: 01015556416
        `.trim();
        break;

      case "reminder":
        subject = "⏰ تذكير برحلتك القادمة - ElSawa7";
        message = `
مرحباً ${userName}!

تذكير: رحلتك غداً 🚌

📍 من: ${trip.origin}
📍 إلى: ${trip.destination}
⏰ الموعد: ${trip.departure_time}
🎫 ترتيبك: #${reservation.queue_position}

استعد للانطلاق!
ElSawa7 - 01015556416
        `.trim();
        break;
    }

    const results = { email: false, sms: false };

    // Send Email
    if (resend && userEmail) {
      try {
        await resend.emails.send({
          from: "ElSawa7 <noreply@el-sawa7.lovable.app>",
          to: [userEmail],
          subject,
          html: message.replace(/\n/g, "<br>"),
        });
        results.email = true;
        console.log("Email sent to:", userEmail);
      } catch (e) {
        console.error("Email error:", e);
      }
    }

    // Send SMS
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER && userPhone) {
      try {
        // Validate Egyptian phone number format before sending
        const cleanPhone = userPhone.replace(/\s/g, "");
        const egyptianPhoneRegex = /^(\+20|0)[1-9][0-9]{9}$/;
        
        if (!egyptianPhoneRegex.test(cleanPhone)) {
          console.error("Invalid phone format, skipping SMS:", cleanPhone);
        } else {
          let formattedPhone = cleanPhone;
          if (formattedPhone.startsWith("0")) {
            formattedPhone = "+20" + formattedPhone.substring(1);
          } else if (!formattedPhone.startsWith("+")) {
            formattedPhone = "+20" + formattedPhone;
          }

          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
          const authHeader = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

          // Shorter SMS version
          let smsMessage = "";
          switch (type) {
            case "confirmed":
              smsMessage = `ElSawa7: تم تأكيد حجزك ✅\n${trip.origin}→${trip.destination}\n${trip.trip_date} ${trip.departure_time}\nترتيبك: #${reservation.queue_position}`;
              break;
            case "cancelled":
              smsMessage = `ElSawa7: تم إلغاء حجزك ❌\n${trip.origin}→${trip.destination}\n${trip.trip_date}\nللتواصل: 01015556416`;
              break;
            case "reminder":
              smsMessage = `ElSawa7: تذكير برحلتك غداً ⏰\n${trip.origin}→${trip.destination}\n${trip.departure_time}\nترتيبك: #${reservation.queue_position}`;
              break;
          }

          const smsResponse = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${authHeader}`,
            },
            body: new URLSearchParams({
              To: formattedPhone,
              From: TWILIO_PHONE_NUMBER,
              Body: smsMessage,
            }),
          });

          if (smsResponse.ok) {
            results.sms = true;
            console.log("SMS sent to:", formattedPhone);
          }
        }
      } catch (e) {
        console.error("SMS error:", e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
