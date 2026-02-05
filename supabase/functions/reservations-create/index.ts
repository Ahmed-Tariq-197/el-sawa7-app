import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateReservationRequest {
  tripId: string;
  seatsCount: number;
  paymentProofUrl?: string;
  paymentTransactionId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "يجب تسجيل الدخول أولاً", code: "401" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "جلسة غير صالحة", code: "401" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    const body: CreateReservationRequest = await req.json();

    // Validate input
    if (!body.tripId || typeof body.tripId !== "string") {
      return new Response(
        JSON.stringify({ error: "معرف الرحلة مطلوب", code: "400" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const seatsCount = body.seatsCount || 1;
    if (seatsCount < 1 || seatsCount > 2) {
      return new Response(
        JSON.stringify({ error: "عدد المقاعد يجب أن يكون 1 أو 2", code: "400" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Require payment proof for 2 seats
    if (seatsCount === 2 && !body.paymentProofUrl && !body.paymentTransactionId) {
      return new Response(
        JSON.stringify({ error: "إثبات الدفع مطلوب لحجز مقعدين", code: "400" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the atomic allocation function
    const { data: result, error } = await supabase.rpc("allocate_seats_atomic", {
      p_trip_id: body.tripId,
      p_user_id: userId,
      p_seats_count: seatsCount,
      p_payment_proof_url: body.paymentProofUrl || null,
      p_payment_transaction_id: body.paymentTransactionId || null,
    });

    if (error) {
      console.error("Allocation error:", error);
      return new Response(
        JSON.stringify({ error: "فشل في الحجز. حاول مرة أخرى", code: "500" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allocation = result?.[0];
    
    if (!allocation?.success) {
      const statusCode = allocation?.error_code === "409" ? 409 : 400;
      return new Response(
        JSON.stringify({ 
          error: allocation?.error_message || "فشل في الحجز",
          code: allocation?.error_code || "400"
        }),
        { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Reservation created:", {
      reservationId: allocation.reservation_id,
      queuePosition: allocation.queue_position,
      userId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        reservationId: allocation.reservation_id,
        queuePosition: allocation.queue_position,
        message: "تم الحجز بنجاح! 🎉",
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in reservations-create:", error);
    return new Response(
      JSON.stringify({ error: "حصل خطأ غير متوقع", code: "500" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
