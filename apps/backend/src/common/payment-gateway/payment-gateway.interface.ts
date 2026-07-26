// این interface اجازه می‌ده درگاه واقعی (زرین‌پال و مشابه) در آینده
// جایگزین بشه بدون تغییر PaymentService — دقیقاً همون الگوی
// SmsProvider در فاز ۱. تا وقتی merchant ID واقعی نداریم، از
// MockPaymentGateway استفاده می‌کنیم.

export interface CreateSessionParams {
  amount: number; // به تومان
  description: string;
  callbackUrl: string;
  // شناسه‌ی داخلی ما برای این تراکنش — گیت‌وی باید موقع callback برگردونش
  internalRefId: string;
}

export interface CreateSessionResult {
  paymentUrl: string;
  gatewayRefId: string;
}

export interface VerifyResult {
  verified: boolean;
  gatewayTransactionId?: string;
  failureReason?: string;
}

export interface PaymentGateway {
  createSession(params: CreateSessionParams): Promise<CreateSessionResult>;
  // verify هرگز نباید فقط بر اساس پارامترهای query که کاربر در callback
  // برمی‌گردونه تصمیم بگیره — باید سرور-به-سرور با خود گیت‌وی چک بشه.
  verify(gatewayRefId: string, expectedAmount: number): Promise<VerifyResult>;
}

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
