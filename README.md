# پلتفرم نوبت‌دهی — Booking Platform

پلتفرم رزرو و نوبت‌دهی آنلاین با فرانت‌اند و بک‌اند مجزا، طراحی‌شده با تمرکز بر امنیت، صحت داده و مقیاس‌پذیری.

## وضعیت فعلی: فاز ۰ — پایه‌ریزی

این نسخه شامل:
- `prisma/schema.prisma` — schema کامل دیتابیس (User, Business, Booking, Payment, Loyalty, Review, Ticket, AuditLog و...)
- `docs/architecture.md` — تصمیمات معماری و دلایل فنی
- `docs/api-contract.md` — قرارداد اولیه‌ی API بین frontend و backend
- `docs/design-system.md` — رنگ‌ها، تایپوگرافی و اصول UI
- اسکلت اجرایی مانو-ریپو (`apps/backend` با NestJS، `apps/frontend` با Next.js، `packages/shared` برای تایپ‌های مشترک)
- `docker-compose.yml` برای اجرای محلی Postgres و Redis
- `.github/workflows/ci.yml` برای lint/test/build خودکار

هنوز منطق دامنه (auth واقعی، موتور رزرو، پرداخت و...) پیاده‌سازی نشده — این‌ها در فازهای ۱ به بعد اضافه می‌شن.

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
