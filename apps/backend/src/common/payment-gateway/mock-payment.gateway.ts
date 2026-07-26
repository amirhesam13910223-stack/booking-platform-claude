import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  PaymentGateway,
  CreateSessionParams,
  CreateSessionResult,
  VerifyResult,
} from './payment-gateway.interface';

// این پیاده‌سازی تا وصل شدن merchant ID واقعی زرین‌پال استفاده میشه.
// یک "گیت‌وی" ساختگی در حافظه شبیه‌سازی می‌کنه: تراکنش رو ثبت می‌کنه
// و verify واقعاً مبلغ رو با چیزی که در createSession ثبت شده مقایسه
// می‌کنه — یعنی حتی این نسخه‌ی mock هم امنیت منطق verify رو تست می‌کنه،
// نه این‌که کورکورانه true برگردونه.
@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  private readonly logger = new Logger(MockPaymentGateway.name);
  private readonly sessions = new Map<string, { amount: number; used: boolean }>();

  async createSession(params: CreateSessionParams): Promise<CreateSessionResult> {
    const gatewayRefId = `mock_${randomUUID()}`;
    this.sessions.set(gatewayRefId, { amount: params.amount, used: false });

    // در گیت‌وی واقعی این یک URL خارجیه که کاربر توش کارت می‌کشه؛
    // این‌جا مستقیم به callback خودمون اشاره می‌کنه تا در dev/CI
    // بدون مرورگر هم قابل تست باشه.
    const paymentUrl = `${params.callbackUrl}?gatewayRefId=${gatewayRefId}&mock=true`;

    this.logger.log(`[MockGateway] session created: ${gatewayRefId} for ${params.amount} تومان`);
    return { paymentUrl, gatewayRefId };
  }

  async verify(gatewayRefId: string, expectedAmount: number): Promise<VerifyResult> {
    const session = this.sessions.get(gatewayRefId);
    if (!session) {
      return { verified: false, failureReason: 'تراکنش نامعتبر یا منقضی‌شده' };
    }
    if (session.used) {
      return { verified: false, failureReason: 'این تراکنش قبلاً verify شده است' };
    }
    if (session.amount !== expectedAmount) {
      return { verified: false, failureReason: 'مبلغ تراکنش مطابقت ندارد' };
    }
    session.used = true;
    return { verified: true, gatewayTransactionId: `mocktx_${randomUUID()}` };
  }
}
