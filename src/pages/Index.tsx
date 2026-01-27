import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Clock, Users, Smartphone, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: "آمان كامل",
      description: "جميع السائقين معتمدين ومتحقق من هويتهم",
    },
    {
      icon: Clock,
      title: "حجز سريع",
      description: "احجز مكانك في ثواني معدودة",
    },
    {
      icon: Users,
      title: "شفافية تامة",
      description: "شوف ترتيبك في الطابور مباشرة",
    },
    {
      icon: Smartphone,
      title: "تطبيق سهل",
      description: "واجهة بسيطة وسهلة الاستخدام",
    },
  ];

  const steps = [
    { number: "١", title: "سجّل حسابك", description: "أنشئ حساب جديد كراكب أو سائق" },
    { number: "٢", title: "اختار رحلتك", description: "حدد الوجهة والعربية المناسبة" },
    { number: "٣", title: "ادفع واحجز", description: "ادفع عبر فودافون كاش وأكد حجزك" },
    { number: "٤", title: "استمتع برحلتك", description: "تابع ترتيبك واستعد للانطلاق" },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="طلاب سعداء مع حافلة ElSawa7"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/80 to-background/60" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground mb-6 animate-fade-in">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="text-sm font-medium">منصة موثوقة لطلاب الجامعات</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              احجز مكانك
              <br />
              <span className="text-primary">بأمان وسهولة</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              المنصة الآمنة لحجز مواصلات طلاب الجامعات. سجّل الآن واستمتع برحلة مريحة مع سائقين معتمدين.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button variant="accent" size="xl" asChild className="group">
                <Link to="/register">
                  إحجز مكانك الآن
                  <ArrowLeft className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/about">اعرف أكتر</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 mt-8 pt-8 border-t border-border/50 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">سائقين معتمدين</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">دفع آمن</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">دعم فوري</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ليه تختار <span className="text-primary">ElSawa7</span>؟
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نقدملك تجربة حجز مواصلات سهلة وآمنة بمميزات مش هتلاقيها في أي مكان تاني
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card-soft p-6 text-center hover:shadow-glow transition-smooth animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              إزاي تحجز؟
            </h2>
            <p className="text-lg text-muted-foreground">
              ٤ خطوات بس وهتكون جاهز للرحلة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                  <span className="text-2xl font-bold text-primary-foreground">{step.number}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
                
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-0 w-full h-0.5 bg-border -z-10 transform translate-x-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            جاهز تبدأ رحلتك؟
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            سجّل الآن مجاناً واحجز أول رحلة ليك مع ElSawa7
          </p>
          <Button variant="accent" size="xl" asChild className="animate-pulse-glow">
            <Link to="/register">
              إنشاء حساب مجاني
              <ArrowLeft className="h-5 w-5 mr-2" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
