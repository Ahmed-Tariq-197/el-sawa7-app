import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: "تم إرسال رسالتك بنجاح",
      description: "هنرد عليك في أقرب وقت ممكن",
    });
    
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "الهاتف",
      value: "01015556416",
      href: "tel:+201015556416",
      description: "متاحين من ٩ صباحاً لـ ٩ مساءً",
    },
    {
      icon: Mail,
      title: "البريد الإلكتروني",
      value: "support@elsawa7.com",
      href: "mailto:support@elsawa7.com",
      description: "رد خلال ٢٤ ساعة",
    },
    {
      icon: MapPin,
      title: "العنوان",
      value: "القاهرة، مصر",
      href: null,
      description: "المقر الرئيسي",
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            تواصل معنا
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            عندك سؤال أو اقتراح؟ احنا هنا عشان نساعدك. راسلنا وهنرد عليك في أقرب وقت.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="card-soft p-8">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  ابعتلنا رسالة
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      الاسم
                    </label>
                    <Input
                      required
                      placeholder="اكتب اسمك"
                      className="text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      رقم الهاتف
                    </label>
                    <Input
                      required
                      type="tel"
                      placeholder="01xxxxxxxxx"
                      className="text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    البريد الإلكتروني
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="example@email.com"
                    className="text-right"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    الموضوع
                  </label>
                  <Input
                    required
                    placeholder="موضوع الرسالة"
                    className="text-right"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    الرسالة
                  </label>
                  <Textarea
                    required
                    placeholder="اكتب رسالتك هنا..."
                    rows={5}
                    className="text-right resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "جاري الإرسال..."
                  ) : (
                    <>
                      إرسال الرسالة
                      <Send className="h-5 w-5 mr-2" />
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  معلومات التواصل
                </h2>
                <div className="space-y-6">
                  {contactInfo.map((info) => (
                    <div key={info.title} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {info.title}
                        </h3>
                        {info.href ? (
                          <a href={info.href} className="text-primary font-medium hover:underline">
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-primary font-medium">{info.value}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ hint */}
              <div className="card-soft p-6 bg-accent/10 border-accent/30">
                <h3 className="font-semibold text-foreground mb-2">
                  أسئلة شائعة؟
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  ممكن تلاقي إجابة سؤالك في صفحة الأسئلة الشائعة
                </p>
                <Button variant="accent-outline" size="sm" asChild>
                  <Link to="/faq">الأسئلة الشائعة</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
