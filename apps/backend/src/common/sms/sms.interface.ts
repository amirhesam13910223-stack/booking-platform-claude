// این interface اجازه میده provider واقعی پیامک (کاوه‌نگار، ملی‌پیامک و...)
// در فازهای بعدی جایگزین بشه بدون تغییر کد ماژول‌های دیگه — فقط
// binding داخل SmsModule عوض میشه.
export interface SmsProvider {
  send(phone: string, message: string): Promise<void>;
}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
