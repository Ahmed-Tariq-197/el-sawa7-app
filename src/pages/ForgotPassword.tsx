import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: { email },
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "تم إرسال الرابط ✅",
        description: "راجع بريدك الإلكتروني",
      });
    } catch (error: any) {
      // Don't reveal if email exists or not
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">
            راجع بريدك الإلكتروني
          </h1>
          <p className="text-muted-foreground mb-8">
            لو البريد ده مسجل عندنا، هتلاقي رسالة فيها رابط لإعادة تعيين كلمة المرور.
            <br />
            <span className="text-sm">الرابط صالح لمدة ساعة واحدة.</span>
          </p>
          <Link to="/login">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              العودة لتسجيل الدخول
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-block mb-8">
          <Logo size="md" />
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">
          نسيت كلمة المرور؟
        </h1>
        <p className="text-muted-foreground mb-8">
          أدخل بريدك الإلكتروني وهنبعتلك رابط لإعادة تعيين كلمة المرور
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Input
                type="email"
                required
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-right pr-10"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <Button
            type="submit"
            variant="hero"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
          </Button>
        </form>

        <Link
          to="/login"
          className="mt-6 inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-smooth"
        >
          <ArrowLeft className="h-4 w-4 ml-1" />
          العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
