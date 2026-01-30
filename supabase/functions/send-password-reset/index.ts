import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PasswordResetRequest {
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate password reset link using Supabase
    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${req.headers.get("origin") || "https://el-sawa7.lovable.app"}/reset-password`,
      },
    });

    if (resetError) {
      console.error("Reset link generation error:", resetError);
      // Don't reveal if email exists or not for security
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resetUrl = data.properties?.action_link;

    if (!resetUrl) {
      console.error("No reset URL generated");
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "ElSawa7 <noreply@resend.dev>",
      to: [email],
      subject: "إعادة تعيين كلمة المرور - ElSawa7",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; }
            .logo { text-align: center; margin-bottom: 20px; }
            .logo h1 { color: #0B6E4F; margin: 0; font-size: 28px; }
            h2 { color: #333; margin-bottom: 15px; }
            p { color: #666; line-height: 1.6; }
            .btn { display: inline-block; background: #0B6E4F; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>🚌 ElSawa7</h1>
            </div>
            <h2>إعادة تعيين كلمة المرور</h2>
            <p>أهلاً بيك!</p>
            <p>استلمنا طلب لإعادة تعيين كلمة المرور الخاصة بحسابك. اضغط على الزر ده لإنشاء كلمة مرور جديدة:</p>
            <a href="${resetUrl}" class="btn">إعادة تعيين كلمة المرور</a>
            <p>لو مش انت اللي طلبت ده، تجاهل الرسالة دي.</p>
            <p>الرابط ده صالح لمدة ساعة واحدة فقط.</p>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ElSawa7 - جميع الحقوق محفوظة</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
