import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { AppleSignInButton } from "@/components/AppleSignInButton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
const Login = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "أهلاً بيك تاني في ElSawa7",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "حصل مشكلة. حاول تاني.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-block mb-8">
            <Logo size="md" />
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            تسجيل الدخول
          </h1>
          <p className="text-muted-foreground mb-8">
            أهلاً بيك تاني! سجّل دخولك لمتابعة حجوزاتك
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
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="text-right pr-10"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="text-right pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link
                to="/forgot-password"
                className="text-primary hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "جاري الدخول..." : "تسجيل الدخول"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  أو
                </span>
              </div>
            </div>

            <GoogleSignInButton className="w-full" />
            <AppleSignInButton className="w-full" />
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            مش عندك حساب؟{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              سجّل دلوقتي
            </Link>
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-smooth"
          >
            <ArrowLeft className="h-4 w-4 ml-1" />
            الرجوع للصفحة الرئيسية
          </Link>
        </div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-primary items-center justify-center p-12">
        <div className="text-center text-primary-foreground max-w-md">
          <h2 className="text-4xl font-bold mb-6">
            احجز رحلتك معانا
          </h2>
          <p className="text-lg text-primary-foreground/80">
            منصة ElSawa7 بتوفرلك تجربة حجز سهلة وآمنة مع سائقين معتمدين
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
