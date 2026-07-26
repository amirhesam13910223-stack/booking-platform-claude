# API Contract (نسخه‌ی اولیه — پایه‌ی فاز ۰)

قرارداد کلی: تمام endpointها زیر `/api/v1` هستن. پاسخ‌ها فرمت یکسان دارن:
```json
{ "success": true, "data": {...} }
{ "success": false, "error": { "code": "...", "message": "..." } }
```
احراز هویت با هدر `Authorization: Bearer <access_token>`.

## Auth

**نکته‌ی پیاده‌سازی**: `refreshToken` در یک httpOnly cookie (`refresh_token`، محدود به مسیر `/api/v1/auth`) ست میشه — کلاینت وب هیچ‌وقت مستقیم بهش دسترسی نداره. کلاینت‌های بدون کوکی (مثلاً اپ موبایل در فازهای بعدی) می‌تونن جایگزین در بدنه‌ی درخواست `refresh`/`logout` بفرستن. `accessToken` در پاسخ JSON برمی‌گرده و کلاینت در حافظه (نه localStorage) نگهش می‌داره.

| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| POST | /auth/register/request-otp | ارسال OTP برای ثبت‌نام | عمومی |
| POST | /auth/register/verify | تایید OTP + ساخت حساب + صدور توکن | عمومی |
| POST | /auth/login | ورود با شماره+رمز | عمومی |
| POST | /auth/login/otp/request | درخواست OTP برای ورود | عمومی |
| POST | /auth/login/otp/verify | تایید OTP و ورود | عمومی |
| POST | /auth/refresh | گرفتن access token جدید (rotation) | عمومی (با refresh token معتبر) |
| POST | /auth/logout | ابطال refresh token فعلی | عمومی (idempotent) |
| POST | /auth/forgot-password | شروع بازیابی رمز | عمومی |
| POST | /auth/reset-password | تنظیم رمز جدید با کد (تمام نشست‌ها باطل میشن) | عمومی |
| GET | /auth/me | اطلاعات کاربر لاگین‌شده | کاربر لاگین‌شده |

## Users
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| PATCH | /users/me | ویرایش پروفایل | خود کاربر |
| GET | /users/me/sessions | لیست نشست‌های فعال | خود کاربر |
| DELETE | /users/me/sessions/:id | خروج از یک دستگاه خاص | خود کاربر |
| DELETE | /users/me | درخواست حذف حساب | خود کاربر |

## Business (ثبت و مدیریت کسب‌وکار)

**نکته‌ی پیاده‌سازی**: مسیرهای مدیریتی (`/businesses/...`) نیاز به عضویت در همون کسب‌وکار دارن (`BusinessRoleGuard` + `@BusinessRoles(...)`) — این مستقل از نقش سراسری کاربره. مسیرهای عمومی/جستجو عمداً زیر یک top-level جدا (`/discover/businesses`) هستن، نه زیرمسیر `/businesses`، تا با route پارامتری `GET /businesses/:id` (که محافظت‌شده‌ست) تداخل مسیر نداشته باشن — این یک تصمیم آگاهانه‌ست، نه ناهماهنگی.

| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| POST | /businesses | ایجاد کسب‌وکار (خودکار OWNER میشه) | کاربر لاگین‌شده |
| GET | /businesses/mine | لیست کسب‌وکارهایی که عضوشونم | کاربر لاگین‌شده |
| GET | /businesses/:id | مشاهده‌ی کامل (owner-facing) | OWNER/MANAGER/STAFF همون کسب‌وکار |
| PATCH | /businesses/:id | ویرایش اطلاعات پایه | OWNER/MANAGER |
| PUT | /businesses/:id/cancellation-policy | تنظیم سیاست لغو | OWNER |
| POST | /businesses/:id/documents | ثبت URL مدرک KYC (آپلود واقعی فایل: فاز بعدی) | OWNER |
| GET | /discover/businesses?query&category&city&page&pageSize | جستجوی عمومی (فقط APPROVED) | عمومی |
| GET | /discover/businesses/:id | جزئیات عمومی یک کسب‌وکار (فقط APPROVED) | عمومی |

### Branch
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| POST | /businesses/:id/branches | افزودن شعبه | OWNER/MANAGER |
| GET | /businesses/:id/branches | لیست شعب | OWNER/MANAGER/STAFF |
| PATCH | /businesses/:id/branches/:branchId | ویرایش شعبه | OWNER/MANAGER |

### Service
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| POST | /businesses/:id/services | افزودن خدمت | OWNER/MANAGER |
| GET | /businesses/:id/services | لیست خدمات | OWNER/MANAGER/STAFF |
| PATCH | /businesses/:id/services/:serviceId | ویرایش خدمت | OWNER/MANAGER |
| POST | /businesses/:id/services/:serviceId/staff/:staffMemberId | اختصاص کارمند به خدمت | OWNER/MANAGER |
| DELETE | /businesses/:id/services/:serviceId/staff/:staffMemberId | لغو اختصاص | OWNER/MANAGER |

### Staff
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| POST | /businesses/:id/staff/invite | افزودن کارمند (باید از قبل ثبت‌نام کرده باشه) | OWNER/MANAGER |
| GET | /businesses/:id/staff | لیست کارکنان | OWNER/MANAGER/STAFF |
| DELETE | /businesses/:id/staff/:staffMemberId | غیرفعال‌سازی (OWNER قابل غیرفعال‌سازی نیست) | OWNER/MANAGER |

### Working Hours & Holidays
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| PUT | /businesses/:id/working-hours | جایگزینی کامل ساعات کاری شعبه یا یک کارمند | OWNER/MANAGER |
| POST | /businesses/:id/holidays | افزودن تعطیلی (شعبه یا کارمند) | OWNER/MANAGER |
| GET | /businesses/:id/holidays?branchId&staffMemberId | لیست تعطیلات | OWNER/MANAGER/STAFF |

## Admin — بررسی کسب‌وکار
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| GET | /admin/businesses | صف بررسی (وضعیت PENDING_REVIEW) | ادمین |
| POST | /admin/businesses/:id/approve | تایید کسب‌وکار | ادمین |
| POST | /admin/businesses/:id/reject | رد با دلیل (`{ reason }`) | ادمین |
| POST | /admin/businesses/:id/suspend | تعلیق با دلیل (`{ reason }`) | ادمین |

## Booking (موتور رزرو)

**نکته‌ی پیاده‌سازی**: مسیر availability عمداً زیر `/discover/availability` هست (نه `/businesses/:id/availability`) — همون دلیل قبلی (تداخل با route پارامتری guard-شده). قفل concurrency-safe با Redis (`SET NX PX`) + بررسی تراکنشی تداخل زمانی در دیتابیس پیاده‌سازی شده؛ هر ۱ دقیقه یک cron job، رزروهای HOLD منقضی‌شده رو خودکار آزاد می‌کنه.

| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| GET | /discover/availability/:businessId?serviceId&staffMemberId&branchId&date | زمان‌های آزاد | عمومی |
| POST | /bookings/hold | ایجاد قفل موقت روی یک بازه (concurrency-safe) | کاربر لاگین‌شده |
| POST | /bookings/recurring | رزرو تکرارشونده‌ی هفتگی (all-or-nothing، حداکثر ۵۲ جلسه) | کاربر لاگین‌شده |
| POST | /bookings/:id/confirm | تایید نهایی (به PENDING اگر بیعانه لازمه، وگرنه CONFIRMED) | کاربر لاگین‌شده (مالک رزرو) |
| POST | /bookings/recurring/:groupId/confirm | تایید همه‌ی جلسات یک رزرو تکرارشونده | کاربر لاگین‌شده (مالک) |
| POST | /bookings/:id/cancel | لغو توسط کاربر (محاسبه‌ی خودکار جریمه طبق سیاست لغو) | کاربر لاگین‌شده (مالک رزرو) |
| POST | /bookings/:id/reschedule | تغییر زمان (اعتبارسنجی مجدد با همون منطق availability) | کاربر لاگین‌شده (مالک رزرو) |
| GET | /bookings/me | لیست نوبت‌های من | کاربر لاگین‌شده |
| GET | /businesses/:id/bookings?branchId&staffMemberId&from&to&status | تقویم رزروهای کسب‌وکار | OWNER/MANAGER/STAFF |
| PATCH | /businesses/:id/bookings/:bookingId/status | تغییر وضعیت (با ماتریس انتقال مجاز) | OWNER/MANAGER |
| POST | /businesses/:id/bookings/:bookingId/cancel | لغو توسط کسب‌وکار (بدون جریمه برای مشتری) | OWNER/MANAGER |

### دامنه‌ی خارج از این فاز (تصمیم آگاهانه)
لیست انتظار (waitlist) و رزرو گروهی چند-نفره (چند مهمان روی یک نوبت مشترک) در این فاز پیاده نشدن — schema فعلی این مفاهیم رو نداره و افزودنشون نیاز به migration و طراحی جدا داره. رزرو تکرارشونده (چند جلسه‌ی هفتگی برای همون کاربر) به‌جاش پیاده شده چون با schema فعلی به‌طور طبیعی جا می‌افته.

## Payment
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| POST | /payments/initiate | شروع پرداخت برای یک booking | کاربر لاگین‌شده |
| GET/POST | /payments/callback/:gateway | callback درگاه (verify سمت سرور) | عمومی (امضا/verify اجباری) |
| POST | /payments/:id/refund | استرداد وجه | ادمین/سیستم |
| GET | /wallet/me | موجودی و تاریخچه کیف پول | کاربر لاگین‌شده |
| POST | /wallet/topup | شارژ کیف پول | کاربر لاگین‌شده |

## Discount / Loyalty / Referral
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| POST | /coupons/validate | اعتبارسنجی کد تخفیف | کاربر لاگین‌شده |
| GET | /loyalty/me | امتیاز و سطح وفاداری | کاربر لاگین‌شده |
| GET | /referral/me | لینک/کد ارجاع من | کاربر لاگین‌شده |

## Review
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| POST | /bookings/:id/review | ثبت نظر بعد از انجام نوبت | کاربر لاگین‌شده (فقط صاحب booking) |
| POST | /reviews/:id/reply | پاسخ کسب‌وکار به نظر | مالک/منیجر |
| POST | /admin/reviews/:id/moderate | تایید/رد نظر گزارش‌شده | ادمین |

## Ticket (پشتیبانی و اختلاف)
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| POST | /tickets | ایجاد تیکت | کاربر لاگین‌شده |
| POST | /tickets/:id/messages | افزودن پیام | طرفین تیکت/ادمین |
| PATCH | /admin/tickets/:id/resolve | حل و بستن تیکت | ادمین |

## Settlement (تسویه‌حساب)
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| GET | /businesses/:id/settlements | تاریخچه تسویه | مالک |
| POST | /admin/settlements/run | اجرای دستی چرخه‌ی تسویه | ادمین |

---
این سند مرجع اولیه برای هماهنگی frontend/backend در فازهای بعدیه؛ با شروع هر فاز باید DTOهای دقیق (validation rules، پاسخ خطا) بهش اضافه بشه.
