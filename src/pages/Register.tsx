import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, Car, Users, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "driver" ? "driver" : "passenger";
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"passenger" | "driver">(initialRole);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمة المرور مش متطابقة",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "خطأ",
        description: "كلمة المرور لازم تكون ٨ حروف على الأقل",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            role: role,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      toast({
        title: "تم إنشاء حسابك بنجاح! 🎉",
        description: "أهلاً بيك في ElSawa7",
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "خطأ في التسجيل",
        description: error.message || "حصل مشكلة. حاول تاني.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-primary items-center justify-center p-12">
        <div className="text-center text-primary-foreground max-w-md">
          <h2 className="text-4xl font-bold mb-6">
            انضم لمجتمع ElSawa7
          </h2>
          <p className="text-lg text-primary-foreground/80">
            سواء كنت طالب عايز توصل بأمان أو سائق عايز تقدم خدماتك، مكانك معانا
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link to="/" className="inline-block mb-8">
            <Logo size="md" />
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            إنشاء حساب جديد
          </h1>
          <p className="text-muted-foreground mb-6">
            سجّل معانا وابدأ رحلتك مع ElSawa7
          </p>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRole("passenger")}
              className={`p-4 rounded-xl border-2 transition-smooth text-center ${
                role === "passenger"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Users className={`h-8 w-8 mx-auto mb-2 ${role === "passenger" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-medium ${role === "passenger" ? "text-primary" : "text-foreground"}`}>
                راكب
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRole("driver")}
              className={`p-4 rounded-xl border-2 transition-smooth text-center ${
                role === "driver"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Car className={`h-8 w-8 mx-auto mb-2 ${role === "driver" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-medium ${role === "driver" ? "text-primary" : "text-foreground"}`}>
                سائق
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                الاسم الكامل
              </label>
              <div className="relative">
                <Input
                  required
                  placeholder="اكتب اسمك"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="text-right pr-10"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                رقم الهاتف
              </label>
              <div className="relative">
                <Input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="text-right pr-10"
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

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
                  placeholder="٨ حروف على الأقل"
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
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="أعد كتابة كلمة المرور"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className="text-right pr-10"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
            </Button>
          </form>

          <p className="mt-6 text-center text-muted-foreground text-sm">
            بالتسجيل، أنت موافق على{" "}
            <Link to="/terms" className="text-primary hover:underline">
              شروط الاستخدام
            </Link>{" "}
            و{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              سياسة الخصوصية
            </Link>
          </p>

          <p className="mt-4 text-center text-muted-foreground">
            عندك حساب؟{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              سجّل دخولك
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
    </div>
  );
};

export default Register;
