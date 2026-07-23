import { SetMetadata } from '@nestjs/common';

export const BUSINESS_ROLES_KEY = 'businessRoles';

// روی route هایی که زیرمجموعه‌ی /businesses/:id/... هستن استفاده میشه.
// مستقل از GlobalRole (کاربر/ادمین) — این نقش داخل همون کسب‌وکاره.
export const BusinessRoles = (...roles: Array<'OWNER' | 'MANAGER' | 'STAFF'>) =>
  SetMetadata(BUSINESS_ROLES_KEY, roles);
