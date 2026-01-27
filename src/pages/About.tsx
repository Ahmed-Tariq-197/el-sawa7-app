import { Link } from "react-router-dom";
import { Shield, Users, Award, Target, CheckCircle2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "الأمان أولاً",
      description: "نتحقق من هوية جميع السائقين ونتأكد من سلامة العربيات",
    },
    {
      icon: Users,
      title: "مجتمع موثوق",
      description: "طلاب وسائقين معتمدين في بيئة آمنة ومحترمة",
    },
    {
      icon: Award,
      title: "جودة الخدمة",
      description: "نهتم بتجربتك من أول حجز لحد ما توصل",
    },
    {
      icon: Target,
      title: "شفافية كاملة",
      description: "كل حاجة واضحة: الأسعار، الترتيب، والتفاصيل",
    },
  ];

  const stats = [
    { number: "+500", label: "طالب مسجل" },
    { number: "+50", label: "سائق معتمد" },
    { number: "+1000", label: "رحلة مكتملة" },
    { number: "٤.٩", label: "تقييم المستخدمين" },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            عن <span className="text-primary">ElSawa7</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            منصة ElSawa7 اتأسست لتوفير حل آمن وموثوق لمشكلة مواصلات طلاب الجامعات. 
            هدفنا إن كل طالب يوصل لجامعته بأمان وراحة.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                مهمتنا
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                نسعى لتوفير منصة حجز مواصلات آمنة وموثوقة لطلاب الجامعات في مصر. 
                نؤمن إن كل طالب يستحق وسيلة مواصلات آمنة ومريحة تساعده يركز على دراسته.
              </p>
              <ul className="space-y-3">
                {[
                  "سائقين معتمدين ومتحقق من هويتهم",
                  "نظام حجز سهل وسريع",
                  "دفع آمن عبر فودافون كاش",
                  "دعم فوري على مدار الساعة",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-primary rounded-2xl p-8 text-primary-foreground">
              <h3 className="text-2xl font-bold mb-4">رؤيتنا</h3>
              <p className="text-primary-foreground/90 text-lg">
                نطمح نكون المنصة الأولى والأكثر ثقة لحجز مواصلات طلاب الجامعات في مصر، 
                ونوصل خدماتنا لجميع المحافظات.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            قيمنا
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div key={value.title} className="card-soft p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            انضم لمجتمع ElSawa7
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            سواء كنت طالب أو سائق، مكانك معانا
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/register">سجّل كراكب</Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/register?role=driver">سجّل كسائق</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
