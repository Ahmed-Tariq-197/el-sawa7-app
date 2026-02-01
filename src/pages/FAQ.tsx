import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "كيف أحجز رحلة؟",
    answer: "يمكنك حجز رحلة بالضغط على 'الرحلات المتاحة' من القائمة الرئيسية، ثم اختيار الرحلة المناسبة لك والضغط على 'احجز الآن'. بعدها قم بتحويل المبلغ عبر فودافون كاش وارفع صورة الإيصال."
  },
  {
    question: "إزاي أعرف إن الدفع اتأكد؟",
    answer: "بعد رفع صورة الإيصال، يتم التحقق منها تلقائياً بالذكاء الاصطناعي. ستصلك رسالة تأكيد على حسابك وفي البريد الإلكتروني ورسالة SMS عند تأكيد الحجز من الإدارة."
  },
  {
    question: "مين بيشوف مكاني؟",
    answer: "المعلومات الخاصة بموقعك تكون متاحة فقط للسائق المكلف برحلتك، وذلك بعد تأكيد الحجز وبدء الرحلة فقط. لا يتم مشاركة بياناتك مع أي طرف آخر."
  },
  {
    question: "إزاي أقيّم السائق؟",
    answer: "بعد انتهاء الرحلة، ستظهر لك نافذة لتقييم السائق من 1 إلى 5 نجوم مع إمكانية إضافة تعليق. تقييمك يساعد في تحسين جودة الخدمة."
  },
  {
    question: "إزاي أتواصل في حالة الطوارئ؟",
    answer: "يمكنك طلب المساعدة في أي وقت عن طريق صفحة 'اتصل بنا' أو الاتصال مباشرة برقم الطوارئ: 01015556416. فريق الدعم متاح على مدار الساعة."
  },
  {
    question: "هل يمكنني إلغاء الحجز؟",
    answer: "نعم، يمكنك إلغاء الحجز طالما كان في حالة 'انتظار'. اذهب إلى 'حجوزاتي' واضغط على 'إلغاء الحجز'. ملاحظة: الحجوزات المؤكدة لا يمكن إلغاؤها."
  },
  {
    question: "كم مقعد يمكنني حجزه؟",
    answer: "يمكنك حجز مقعد واحد أو مقعدين كحد أقصى في الحجز الواحد. لحجز مقعدين، يجب رفع إيصال دفع يثبت تحويل المبلغ الإجمالي."
  },
  {
    question: "ماذا يحدث لو الرحلة امتلأت؟",
    answer: "إذا امتلأت الرحلة، يمكنك التصويت لإضافة عربية جديدة. عند وصول 14 صوت، يتم إخطار الإدارة لإضافة عربية إضافية للرحلة."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // JSON-LD structured data for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <Layout>
      {/* SEO Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            الأسئلة الشائعة
          </h1>
          <p className="text-muted-foreground text-lg">
            إجابات لأكثر الأسئلة شيوعاً عن خدمات ElSawa7
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div
              key={index}
              className="card-soft overflow-hidden transition-smooth"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-5 text-right hover:bg-muted/50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="font-semibold text-foreground text-lg pl-4">
                  {item.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-5 pb-5 pt-0">
                  <div className="border-t border-border pt-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 card-soft p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5">
          <MessageCircle className="h-10 w-10 mx-auto text-primary mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            لسه عندك سؤال؟
          </h2>
          <p className="text-muted-foreground mb-6">
            فريق الدعم موجود عشان يساعدك في أي وقت
          </p>
          <Button variant="hero" asChild>
            <Link to="/contact">
              تواصل معانا
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;