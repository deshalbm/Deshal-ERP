# وثيقة معمارية وإرشادات نظام البريد الإلكتروني (Resend Email Architecture) — Deshal ERP

توضح هذه الوثيقة المعمارية الشاملة، المتطلبات الأمنية، طريقة التشغيل وإدارة قوالب البريد وسجلات الإرسال لخدمة البريد الإلكتروني الخاصة بنظام **Deshal ERP**.

---

## 1. المعمارية الهندسية (System Architecture)

يعتمد نظام البريد الإلكتروني في Deshal ERP على معمارية معزولة وآمنة بالكامل تحظر أي اتصال مباشر بين متصفح العميل (Frontend) وخوادم Resend API:

```text
┌────────────────────────────────────────────────────────┐
│                   Deshal ERP Frontend                  │
│       (React Components / Typed Email Service)         │
└───────────────────────────┬────────────────────────────┘
                            │  Invokes Email Payload
                            ▼  (JWT Authenticated)
┌────────────────────────────────────────────────────────┐
│             Supabase Edge Function (`send-email`)      │
│  - Verifies JWT & Session                              │
│  - Fetches Entity Data & Applies Permission Checks       │
│  - Loads & Renders RTL Arabic HTML Templates           │
│  - Reads SERVER SECRET: `RESEND_API_KEY`               │
└───────────────────────────┬────────────────────────────┘
                            │  HTTPS POST
                            ▼
┌────────────────────────────────────────────────────────┐
│                     Resend API                         │
│               (https://api.resend.com/emails)          │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            Audit Trail DB (`public.email_logs`)         │
│   (PENDING ──► SENT / FAILED / DELIVERED / BOUNCED)    │
└────────────────────────────────────────────────────────┘
```

---

## 2. المعايير والقواعد الأمنية الإلزامية (Security Rules)

1. **حظر المفاتيح في الواجهة (Zero Frontend Keys)**:
   - يمنع منعاً باتاً كتابة أو تخزين `RESEND_API_KEY` داخل المتصفح أو `localStorage` أو ملفات JS العامة (`VITE_*`).
   - المفتاح متوفر حصرياً كمتغير بيئة سري على الخادم (`Server Secret`).

2. **منع إرسال HTML حر (No Raw HTML Payload)**:
   - الواجهة ترسل فقط بيانات مرمزّة مثل: `{ type: 'INVOICE_CREATED', entityId: 'inv-123' }`.
   - الخادم يتولى جلب البيانات من الداتابيز، قوالب الـ HTML المعتمدة، وتحديد المستلم الحقيقي.

3. **العمليات التجارية غير معطلة (Non-Blocking Failure)**:
   - فشل إرسال البريد لا يؤدي إطلاقاً لإلغاء إضافة موظف أو إصدار فاتورة أو اعتماد طلب.
   - يتم تتبع الفشل في جدول `email_logs` بحالة `FAILED` مع تسجيل نص الخطأ ليتسنى إعادة المحاولة.

---

## 3. متغيرات البيئة المطلوب إعدادها (Environment Variables)

يتم ضبط المتغيرات التالية في ملف `.env` بالسيرفر وفي إعدادات `Supabase Edge Functions`:

```env
# مفتاح Resend API السري الخاص بالحساب
RESEND_API_KEY=re_123456789_abcdefghijklmnopqrstuvwxyz

# البريد المعرف الرسمي للمرسل
EMAIL_FROM=Deshal ERP <onboarding@resend.dev>

# رابط المنصة الأساسي
APP_URL=https://erp.deshalbm.com

# مفتاح التفعيل لبيئات التطوير والإنتاج (true | false)
EMAIL_ENABLED=true
```

لإعداد المتغيرات في Supabase CLI / Edge Function:
```bash
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
npx supabase secrets set EMAIL_FROM="Deshal ERP <noreply@deshalbm.com>"
npx supabase secrets set EMAIL_ENABLED=true
```

---

## 4. قوالب البريد الإلكترونية المدعومة (Email Templates)

جميع القوالب مصممة بنمط هيدر/فوتر رسمي يحمل هوية **ديشال ERP** بدعم كامل للغة العربية واتجاه **RTL**:

| اسم القالب | النوع (`email_type`) | الوصف |
| :--- | :--- | :--- |
| **Welcome** | `WELCOME_USER` | بريد ترحيب ودعوة انضمام للموظفين والمتعاونين يضم البريد، PIN، ورابط الدخول. |
| **Invoice** | `INVOICE_CREATED` | إشعار صدور الفواتير للعملاء والموردين يضم رقم الفاتورة والملغ واستحقاقه. |
| **Approval** | `REQUEST_APPROVAL` | إشعارات الموافقة أو الرفض على الإجازات والطلبات الإدارية. |
| **Booking** | `BOOKING_CONFIRMATION` | تأكيد حجوزات مساحات العمل والخدمات. |
| **Notification** | `GENERAL_NOTIFICATION` | التنبيهات العامة والإدارية بالنظام. |
| **Password Reset** | `PASSWORD_RESET` | رابط إعادة تعيين كلمة المرور الآمن. |
| **Test Email** | `TEST_EMAIL` | بريد اختباري للتأكد من نجاح ربط السيرفر بـ Resend. |

---

## 5. سجلات ومراقبة الإرسال (`email_logs` Audit Trail)

يحتوي الجدول `public.email_logs` على الحقول التالية:

- `id`: المعرف الفريد.
- `company_id`: معرف الشركة المرتبطة.
- `recipient`: البريد المستهدف.
- `email_type`: نوع البريد.
- `status`: حالة الرسالة (`PENDING`, `SENT`, `FAILED`, `DELIVERED`, `BOUNCED`).
- `provider_message_id`: المعرف المرجعي الصادر من Resend.
- `error_message`: تفاصيل أي خطأ في حال الفشل.
- `created_at`: تاريخ ووقت الطلب.

---

## 6. كيفية استخدام الخدمة في الكود (Usage Examples)

### إرسال بريد ترحيبي بموظف جديد:
```typescript
import { sendWelcomeEmail } from '@/lib/email/emailService';

await sendWelcomeEmail({
  employeeId: emp.id,
  recipientEmail: emp.email,
  recipientName: emp.fullName,
  roleTitle: emp.jobTitle,
  tempPassword: tempPass,
  pinCode: pin,
});
```

### إرسال إشعار فاتورة:
```typescript
import { sendInvoiceEmail } from '@/lib/email/emailService';

await sendInvoiceEmail({
  invoiceId: invoice.id,
  customerEmail: invoice.customerEmail,
  invoiceNumber: invoice.number,
  totalAmount: invoice.total,
});
```

---

## 7. اختبار البريد ومراقبة الأخطاء (Testing & Troubleshooting)

1. **الاختبار من واجهة النظام**:
   - توجه إلى **الإعدادات** -> **نظام البريد الإلكتروني وسجل الصلاحيات**.
   - أدخل عنوان بريدك في صندوق "اختبار ربط واستجابة البريد" وانقر على **إرسال رسالة تجريبية الآن**.
   - انقر على **تحديث سجلات البريد في الداتابيز** لمشاهدة السجل وحالته فوراً.

2. **التأكد من الأمان بـ Bundle Audit**:
   - لا يجوز وجود `RESEND_API_KEY` داخل أي ملف حزمة في `dist/assets/*.js`.
