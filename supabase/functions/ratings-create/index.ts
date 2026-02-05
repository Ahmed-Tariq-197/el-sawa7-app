import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateRatingRequest {
  reservationId: string;
  driverId: string;
  rating: number;
  anonymous?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "يجب تسجيل الدخول أولاً" }),
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
        JSON.stringify({ error: "جلسة غير صالحة" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const passengerId = user.id;
    const body: CreateRatingRequest = await req.json();

    // Validate input
    if (!body.reservationId || !body.driverId) {
      return new Response(
        JSON.stringify({ error: "بيانات ناقصة" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rating = body.rating;
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: "التقييم يجب أن يكون من 1 إلى 5" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the passenger owns this reservation and it's completed
    const { data: reservation, error: resError } = await supabase
      .from("reservations")
      .select("id, user_id, status, trip_id")
      .eq("id", body.reservationId)
      .single();

    if (resError || !reservation) {
      return new Response(
        JSON.stringify({ error: "الحجز مش موجود" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reservation.user_id !== passengerId) {
      return new Response(
        JSON.stringify({ error: "مش حجزك ده" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reservation.status !== "completed") {
      return new Response(
        JSON.stringify({ error: "الرحلة لازم تكون مكتملة عشان تقيّم" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already rated
    const { data: existingRating } = await supabase
      .from("passenger_ratings")
      .select("id")
      .eq("reservation_id", body.reservationId)
      .single();

    if (existingRating) {
      return new Response(
        JSON.stringify({ error: "أنت قيّمت السائق ده قبل كده" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert rating
    const { data: newRating, error: insertError } = await supabase
      .from("passenger_ratings")
      .insert({
        reservation_id: body.reservationId,
        driver_id: body.driverId,
        passenger_id: passengerId,
        rating: rating,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Rating insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "فشل في حفظ التقييم" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update driver's average rating (compute from all ratings)
    const { data: allRatings } = await supabase
      .from("passenger_ratings")
      .select("rating")
      .eq("driver_id", body.driverId);

    if (allRatings && allRatings.length > 0) {
      const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      
      await supabase
        .from("driver_profiles")
        .update({ rating: Math.round(avg * 10) / 10 })
        .eq("user_id", body.driverId);
    }

    console.log("Rating created:", {
      ratingId: newRating.id,
      driverId: body.driverId,
      rating,
    });

    return new Response(
      JSON.stringify({
        success: true,
        ratingId: newRating.id,
        message: "شكراً لتقييمك! ⭐",
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in ratings-create:", error);
    return new Response(
      JSON.stringify({ error: "حصل خطأ" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
