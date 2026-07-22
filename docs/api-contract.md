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
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| POST | /businesses | ایجاد کسب‌وکار (شروع ویزارد) | کاربر لاگین‌شده |
| PATCH | /businesses/:id | ویرایش اطلاعات پایه | مالک/منیجر |
| POST | /businesses/:id/documents | آپلود مدرک KYC | مالک |
| GET | /businesses/:id | مشاهده جزئیات (عمومی برای APPROVED) | عمومی/مالک |
| GET | /businesses | جستجو و فیلتر کسب‌وکارهای فعال | عمومی |
| POST | /businesses/:id/branches | افزودن شعبه | مالک/منیجر |
| POST | /businesses/:id/services | افزودن خدمت | مالک/منیجر |
| POST | /businesses/:id/staff/invite | دعوت کارمند | مالک/منیجر |
| PUT | /businesses/:id/working-hours | تنظیم ساعات کاری | مالک/منیجر |
| PUT | /businesses/:id/cancellation-policy | تنظیم سیاست لغو | مالک |

## Admin — بررسی کسب‌وکار
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| GET | /admin/businesses?status=PENDING_REVIEW | صف بررسی | ادمین |
| POST | /admin/businesses/:id/approve | تایید کسب‌وکار | ادمین |
| POST | /admin/businesses/:id/reject | رد با دلیل | ادمین |
| POST | /admin/businesses/:id/suspend | تعلیق | ادمین |

## Booking (موتور رزرو)
| Method | Path | توضیح | دسترسی |
|---|---|---|---|
| GET | /businesses/:id/availability?serviceId&staffId&date | زمان‌های آزاد | عمومی |
| POST | /bookings/hold | ایجاد قفل موقت روی یک بازه | کاربر لاگین‌شده |
| POST | /bookings/:id/confirm | تایید نهایی (بعد پرداخت/بدون نیاز به پرداخت) | کاربر لاگین‌شده |
| POST | /bookings/:id/cancel | لغو رزرو | کاربر/کسب‌وکار |
| POST | /bookings/:id/reschedule | تغییر زمان | کاربر لاگین‌شده |
| GET | /bookings/me | لیست نوبت‌های من | کاربر لاگین‌شده |
| GET | /businesses/:id/bookings | تقویم رزروهای کسب‌وکار | مالک/منیجر/کارمند |
| PATCH | /businesses/:id/bookings/:bookingId/status | تغییر وضعیت (تایید/انجام‌شده/no-show) | مالک/منیجر |

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
