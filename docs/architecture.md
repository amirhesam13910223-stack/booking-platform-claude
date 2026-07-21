# معماری پلتفرم

## تصمیمات فنی و دلیل هرکدام

| لایه | تکنولوژی | دلیل |
|---|---|---|
| Backend | NestJS + TypeScript | ساختار ماژولار اجباری، DI برای تست‌پذیری واقعی، اکوسیستم بالغ برای auth/validation |
| ORM | Prisma | type-safety کامل بین schema و کد، migration ابزاری قوی، جلوگیری از SQL Injection به‌صورت پیش‌فرض (parameterized queries) |
| Database | PostgreSQL | تراکنش ACID برای پرداخت و رزرو، پشتیبانی native از JSON برای فیلدهای انعطاف‌پذیر (مثل cancellationPolicy) |
| Cache/Lock/Queue | Redis | قفل توزیع‌شده برای جلوگیری از double-booking، صف اطلاع‌رسانی (BullMQ) |
| Frontend | Next.js + TypeScript | SSR برای SEO صفحات عمومی کسب‌وکار، type-safety مشترک با backend |
| Auth | JWT (access کوتاه‌مدت + refresh) | stateless بودن access token برای مقیاس‌پذیری، refresh قابل ابطال برای امنیت |
| Payment Gateway | Zarinpal (اولیه) با لایه‌ی abstraction برای افزودن درگاه‌های بعدی | بازار هدف ایران |

## اصول معماری غیرقابل‌مذاکره

۱. **هیچ منطق امنیتی سمت کلاینت انجام نمیشه.** احراز هویت، RBAC، و اعتبارسنجی ورودی همیشه سمت سرور enforce میشن. فرانت فقط UX رو بهتر می‌کنه، نه اینکه تصمیم امنیتی بگیره.

۲. **جلوگیری از double-booking با قفل واقعی.** هنگام انتخاب یک بازه‌ی زمانی:
   - یک `Booking` با وضعیت `HOLD` و `holdExpiresAt` (مثلاً ۵ دقیقه بعد) ساخته میشه.
   - همزمان یک قفل Redis (`SET NX EX`) روی کلید `lock:staff:{staffId}:{slot}` گرفته میشه.
   - اگر کاربر دوم هم‌زمان همون بازه رو بخواد، یا قفل Redis رد میشه یا کوئری تداخل‌سنجی داخل یک Prisma transaction با `SELECT ... FOR UPDATE` جلوش رو می‌گیره.
   - Job زمان‌بندی‌شده (cron) هر چند دقیقه HOLDهای منقضی‌شده رو آزاد می‌کنه.

۳. **پرداخت هرگز بر اساس پاسخ کلاینت تایید نمیشه.** بعد از بازگشت از درگاه، سرور مستقیماً با API خود درگاه تراکنش رو verify می‌کنه؛ فقط بعد از verify موفق، `Booking.status` به `CONFIRMED` تغییر می‌کنه.

۴. **هر عملیات حساس Audit میشه.** تایید/رد کسب‌وکار، لغو رزرو توسط ادمین، تغییر نقش کاربر، استرداد وجه — همه در جدول `AuditLog` ثبت میشن.

۵. **جداسازی واضح نقش‌ها.** `GlobalRole` (USER/ADMIN) در سطح پلتفرم، و `StaffRole` (OWNER/MANAGER/STAFF) در سطح هر کسب‌وکار جداگانه — یک کاربر می‌تونه هم‌زمان مالک یک کسب‌وکار و مشتری یک کسب‌وکار دیگه باشه، بدون نیاز به دو اکانت.

## ساختار مانو-ریپو

```
/apps
  /backend       → NestJS API
  /frontend      → Next.js (وب کاربر/کسب‌وکار/ادمین)
/packages
  /shared        → تایپ‌های TypeScript مشترک بین backend و frontend (مثلاً enum ها، DTOها)
/prisma
  schema.prisma  → منبع حقیقت (source of truth) ساختار داده
/docs            → مستندات معماری، API contract، Design System
```

## چرا مانو-ریپو؟
چون `packages/shared` امکان میده تایپ‌های DTO/enum بین backend و frontend به‌صورت خودکار sync بمونن — کلاس باگی که در پروژه‌ی قبلی داشتیم (عدم تطابق فرانت و بک به‌خاطر نبود قرارداد مشترک) اینجا از ریشه حذف میشه.
