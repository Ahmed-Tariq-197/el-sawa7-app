# ElSawa7 - منصة نقل الطلاب

تطبيق ويب لنقل الطلاب بين المدن المصرية.

## التقنيات المستخدمة

- React + TypeScript
- Vite (بناء)
- Tailwind CSS (تصميم)
- Supabase (قاعدة البيانات، المصادقة، التخزين)
- Tanstack Query (إدارة البيانات)

## البدء السريع

1. تثبيت المتطلبات:
```bash
npm install
```

2. تشغيل التطبيق محلياً:
```bash
npm run dev
```

## متغيرات البيئة

المتغيرات المطلوبة في ملف `.env`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### متغيرات اختيارية للتتبع

```
MIN_TRACKING_INTERVAL_SECONDS=3     # الحد الأدنى لفاصل التتبع (ثواني)
MAX_ACCURACY_METERS=200             # أقصى دقة مقبولة للموقع (متر)
TRACKING_RETENTION_DAYS=7           # مدة الاحتفاظ بسجلات التتبع (أيام)
REALTIME_TRACKING=false             # تفعيل التتبع الفوري
SMS_TEST_MODE=true                  # وضع اختبار الرسائل النصية
```

## الميزات

- ✅ حجز الرحلات
- ✅ نظام الطوابير
- ✅ إثبات الدفع (Vodafone Cash)
- ✅ تتبع السائق (للركاب المؤكدين فقط)
- ✅ لوحة تحكم الإدارة
- ✅ تقييم السائقين
- ✅ إشعارات فورية

## الأمان

- جميع الجداول محمية بـ Row Level Security (RLS)
- التحقق من JWT في جميع Edge Functions
- عدم كشف بيانات المستخدمين الحساسة

## التطوير

صنع بواسطة: Eng/ Ahmed Tariq
