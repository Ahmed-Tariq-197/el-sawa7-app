import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ValidationRequest {
  imageUrl: string;
  expectedAmount?: number;
  reservationId?: string;
}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  extractedAmount?: number;
  extractedDate?: string;
  extractedTransactionId?: string;
  warnings: string[];
  reasons: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageUrl, expectedAmount, reservationId }: ValidationRequest = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Missing imageUrl" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get signed URL if it's a private bucket path
    let accessibleUrl = imageUrl;
    if (imageUrl.includes("payment-proofs")) {
      const path = imageUrl.split("payment-proofs/")[1];
      if (path) {
        const { data: signedData } = await supabase.storage
          .from("payment-proofs")
          .createSignedUrl(path, 3600);
        if (signedData?.signedUrl) {
          accessibleUrl = signedData.signedUrl;
        }
      }
    }

    // Use Lovable AI to analyze the receipt image
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a Vodafone Cash receipt validator for Egypt. Analyze payment screenshots and extract:
1. Transaction amount (in EGP)
2. Transaction date/time
3. Transaction ID/reference number
4. Sender/receiver phone numbers if visible

Evaluate if this appears to be a legitimate Vodafone Cash payment receipt. Look for:
- Vodafone branding and colors (red theme)
- Standard Vodafone Cash receipt format
- Clear transaction details
- Signs of tampering or editing (unusual fonts, misaligned text, inconsistent colors)

Respond in JSON format ONLY:
{
  "isVodafoneCash": true/false,
  "confidence": 0-100,
  "amount": number or null,
  "date": "YYYY-MM-DD" or null,
  "transactionId": "string" or null,
  "warnings": ["array of concerns"],
  "analysis": "brief explanation in Arabic"
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: expectedAmount 
                  ? `Analyze this payment receipt. Expected amount: ${expectedAmount} EGP`
                  : "Analyze this payment receipt."
              },
              {
                type: "image_url",
                image_url: { url: accessibleUrl }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response
    let parsedResult;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      parsedResult = {
        isVodafoneCash: false,
        confidence: 0,
        warnings: ["فشل في تحليل الإيصال"],
        analysis: "حصل خطأ في التحليل"
      };
    }

    // Build validation result
    const warnings: string[] = parsedResult.warnings || [];
    const reasons: string[] = [];

    if (!parsedResult.isVodafoneCash) {
      reasons.push("الصورة مش شبه إيصال فودافون كاش");
    }

    if (parsedResult.confidence < 50) {
      reasons.push("نسبة الثقة منخفضة");
    }

    if (expectedAmount && parsedResult.amount) {
      if (Math.abs(parsedResult.amount - expectedAmount) > 1) {
        warnings.push(`المبلغ (${parsedResult.amount} ج.م) مختلف عن المتوقع (${expectedAmount} ج.م)`);
      }
    }

    const result: ValidationResult = {
      isValid: parsedResult.isVodafoneCash && parsedResult.confidence >= 60,
      confidence: parsedResult.confidence || 0,
      extractedAmount: parsedResult.amount,
      extractedDate: parsedResult.date,
      extractedTransactionId: parsedResult.transactionId,
      warnings,
      reasons: reasons.length > 0 ? reasons : [parsedResult.analysis || "تم التحقق"],
    };

    // Log the validation attempt
    console.log("Receipt validation:", {
      reservationId,
      result: result.isValid,
      confidence: result.confidence,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in validate-receipt:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        isValid: false,
        confidence: 0,
        warnings: ["حصل خطأ أثناء التحقق"],
        reasons: ["فشل في معالجة الإيصال"]
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
