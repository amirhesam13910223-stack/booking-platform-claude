import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

// دور رمز عبور همیشه bcrypt (کند و مقاوم در برابر brute-force سخت‌افزاری).
const PASSWORD_SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, PASSWORD_SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// برای OTP و refresh token از SHA-256 استفاده می‌کنیم، نه bcrypt:
// این مقادیر خودشون به اندازه‌ی کافی تصادفی/کوتاه‌عمر هستن (OTP با
// انقضا و محدودیت تلاش، refresh token با ۳۲+ بایت انتروپی)، پس
// نیازی به کندی عمدی bcrypt ندارن؛ فقط می‌خوایم plain text در
// دیتابیس ذخیره نشه.
export function sha256Hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
