import { MockPaymentGateway } from './mock-payment.gateway';

describe('MockPaymentGateway', () => {
  let gateway: MockPaymentGateway;

  beforeEach(() => {
    gateway = new MockPaymentGateway();
  });

  it('برای gatewayRefId ناموجود verify رو رد می‌کنه', async () => {
    const result = await gateway.verify('nonexistent', 1000);
    expect(result.verified).toBe(false);
  });

  it('با مبلغ نادرست verify رو رد می‌کنه (جلوگیری از دستکاری مبلغ)', async () => {
    const session = await gateway.createSession({
      amount: 50000,
      description: 'test',
      callbackUrl: 'http://x',
      internalRefId: 'p1',
    });

    const result = await gateway.verify(session.gatewayRefId, 1); // مبلغ دستکاری‌شده

    expect(result.verified).toBe(false);
    expect(result.failureReason).toContain('مبلغ');
  });

  it('با مبلغ درست verify موفق میشه', async () => {
    const session = await gateway.createSession({
      amount: 50000,
      description: 'test',
      callbackUrl: 'http://x',
      internalRefId: 'p1',
    });

    const result = await gateway.verify(session.gatewayRefId, 50000);

    expect(result.verified).toBe(true);
  });

  it('یک تراکنش رو دوبار نمی‌شه verify کرد (جلوگیری از replay)', async () => {
    const session = await gateway.createSession({
      amount: 50000,
      description: 'test',
      callbackUrl: 'http://x',
      internalRefId: 'p1',
    });

    await gateway.verify(session.gatewayRefId, 50000); // بار اول
    const second = await gateway.verify(session.gatewayRefId, 50000); // بار دوم

    expect(second.verified).toBe(false);
  });
});
