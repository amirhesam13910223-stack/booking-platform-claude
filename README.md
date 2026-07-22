# پلتفرم نوبت‌دهی — Booking Platform

پلتفرم رزرو و نوبت‌دهی آنلاین با فرانت‌اند و بک‌اند مجزا، طراحی‌شده با تمرکز بر امنیت، صحت داده و مقیاس‌پذیری.

## وضعیت فعلی: فاز ۱ تکمیل شد — هویت و احراز هویت

**فاز ۰** (پایه‌ریزی): schema کامل دیتابیس، مستندات معماری/API/design-system، اسکلت مانو-ریپو، Docker، CI.

**فاز ۱** (این نسخه) شامل:
- ثبت‌نام با OTP (پیامک شبیه‌سازی‌شده در dev)، ورود با رمز یا OTP
- توکن‌های JWT access (کوتاه‌مدت) + refresh (httpOnly cookie، با rotation و قابلیت ابطال)
- بازیابی رمز عبور با OTP + ابطال خودکار تمام نشست‌ها بعد از تغییر رمز
- مدیریت پروفایل، لیست/ابطال نشست‌های فعال، درخواست حذف حساب (soft delete)
- Guard های سراسری: احراز هویت (`JwtAuthGuard`)، نقش (`RolesGuard`)، محدودیت نرخ درخواست (`ThrottlerGuard`) — به‌صورت پیش‌فرض روی همه‌چیز فعالن مگر با `@Public()` باز بشن
- ۱۹ تست واحد واقعی روی منطق حساس (رمز اشتباه، OTP منقضی، rotation توکن، جلوگیری از user enumeration)

منطق دامنه‌ی بعدی (کسب‌وکار، رزرو، پرداخت) در فازهای ۲ به بعد اضافه می‌شه.

## راه‌اندازی محیط توسعه

```bash
# ۱. سرویس‌های زیرساختی (Postgres + Redis)
docker compose up -d

# ۲. نصب وابستگی‌ها (در ریشه‌ی مانو-ریپو)
npm install

# ۳. کپی فایل env
cp .env.example .env
# مقادیر واقعی (secrets) رو داخل .env جایگزین کنید — هرگز commit نشه

# ۴. اجرای migration اولیه
npm run prisma:migrate

# ۵. اجرای backend
npm run dev:backend

# ۶. اجرای frontend
npm run dev:frontend
```

## ساختار پروژه

```
/apps/backend    → NestJS API
/apps/frontend   → Next.js
/packages/shared → تایپ‌ها/enumهای مشترک
/prisma          → schema دیتابیس
/docs            → مستندات معماری و API
```

## نقشه‌راه فازها
برای فازبندی کامل پروژه به `docs/architecture.md` مراجعه کنید. فاز بعدی: **فاز ۱ — هویت و احراز هویت**.
