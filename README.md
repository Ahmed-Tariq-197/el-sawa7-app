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

### متغيرات اختيارية

```
# التتبع
MIN_TRACKING_INTERVAL_SECONDS=3     # الحد الأدنى لفاصل التتبع (ثواني)
MAX_ACCURACY_METERS=200             # أقصى دقة مقبولة للموقع (متر)
TRACKING_RETENTION_DAYS=7           # مدة الاحتفاظ بسجلات التتبع (أيام)
REALTIME_TRACKING=false             # تفعيل التتبع الفوري

# الإشعارات
VITE_VAPID_PUBLIC_KEY=              # مفتاح VAPID العام للإشعارات
VAPID_PRIVATE_KEY=                  # مفتاح VAPID الخاص (للسيرفر فقط)
PUSH_TEST_MODE=true                 # وضع اختبار الإشعارات
PUSH_RETENTION_DAYS=7               # مدة الاحتفاظ بسجلات الإشعارات

# الرسائل النصية
SMS_TEST_MODE=true                  # وضع اختبار الرسائل النصية (افتراضي: true)
TWILIO_ACCOUNT_SID=                 # معرف حساب Twilio
TWILIO_AUTH_TOKEN=                  # رمز مصادقة Twilio
TWILIO_PHONE_NUMBER=                # رقم هاتف Twilio

# إنشاء المدير (للسيرفر فقط)
SETUP_ADMIN_TOKEN=                  # رمز آمن لإنشاء حسابات المديرين
```

## إعداد Google OAuth

لتفعيل تسجيل الدخول بـ Google:

1. أضف عناوين الـ redirect URLs التالية في Google Cloud Console:
   - `https://your-domain.com`
   - `https://your-domain.com/auth/callback`
   - للتطوير: `http://localhost:5173`

2. تأكد من تفعيل OAuth في لوحة تحكم المشروع

## إنشاء حساب المدير

### الطريقة الأولى: استخدام السكريبت (موصى بها)

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
ADMIN_EMAIL=admin@elsawa7.com \
ADMIN_PASSWORD=SecurePassword123! \
ADMIN_NAME="Admin User" \
ADMIN_PHONE=01015556416 \
node scripts/seed-admin.js
```

### الطريقة الثانية: استخدام Edge Function

1. قم بتعيين `SETUP_ADMIN_TOKEN` في Supabase Secrets
2. استدعِ الـ endpoint:

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/admin-create \
  -H "Content-Type: application/json" \
  -H "x-setup-admin-token: YOUR_SETUP_TOKEN" \
  -d '{
    "email": "admin@elsawa7.com",
    "password": "SecurePassword123!",
    "name": "Admin User",
    "phone": "01015556416"
  }'
```

### الطريقة الثالثة: يدوياً عبر Supabase

1. سجّل حساب عادي عبر `/register`
2. افتح لوحة Supabase > Table Editor > user_roles
3. أضف صف جديد: `user_id: [UUID], role: admin`

## تشغيل الاختبارات

### اختبارات الوحدات
```bash
npm run test
```

### اختبارات E2E (Cypress)
```bash
npm run test:e2e
```

### اختبارات Edge Functions
```bash
cd supabase/functions
deno test --allow-net --allow-env --allow-read
```

## الميزات

- ✅ حجز الرحلات (مع حماية من الحجز المزدوج)
- ✅ نظام الطوابير الذكي
- ✅ إثبات الدفع (Vodafone Cash) مع تحقق AI
- ✅ تتبع السائق (للركاب المؤكدين فقط)
- ✅ لوحة تحكم الإدارة
- ✅ تقييم السائقين
- ✅ إشعارات فورية
- ✅ رسائل ترحيب ذكية
- ✅ بيانات اختبارية للتطوير

## الأمان

- جميع الجداول محمية بـ Row Level Security (RLS)
- التحقق من JWT في جميع Edge Functions
- عدم كشف بيانات المستخدمين الحساسة
- الركاب يرون الأسماء فقط (لا أرقام الهواتف)
- السائقون يرون أرقام الهواتف فقط (لا الأسماء)
- التتبع متاح للركاب المؤكدين فقط
- سجل تدقيق غير قابل للتعديل

## البنية الأمنية

### دوال SECURITY DEFINER
- `log_action()` - تسجيل آمن للتدقيق
- `admin_set_role()` - تعيين الأدوار (للمديرين فقط)
- `driver_view_for_trip()` - عرض أرقام الهواتف للسائق
- `passenger_queue_view()` - عرض الأسماء للركاب
- `get_tracking_positions_secure()` - مواقع التتبع الآمنة
- `allocate_seats_atomic()` - حجز المقاعد بـ transaction

## CI/CD

المشروع يستخدم GitHub Actions للتكامل المستمر:
- Linting (ESLint)
- تدقيق الأمان (npm audit)
- اختبارات الوحدات
- اختبارات Edge Functions (Deno)
- اختبارات E2E (Cypress)

## التطوير

صنع بواسطة: Eng/ Ahmed Tariq
