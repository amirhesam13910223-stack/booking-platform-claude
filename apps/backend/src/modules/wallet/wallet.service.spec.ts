import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PAYMENT_GATEWAY } from '../../common/payment-gateway/payment-gateway.interface';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: { wallet: Record<string, jest.Mock>; payment: Record<string, jest.Mock> };
  let gateway: { createSession: jest.Mock };

  beforeEach(async () => {
    prisma = {
      wallet: { upsert: jest.fn() },
      payment: { create: jest.fn(), update: jest.fn() },
    };
    gateway = { createSession: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: prisma },
        { provide: PAYMENT_GATEWAY, useValue: gateway },
        { provide: ConfigService, useValue: { get: (_k: string, fallback?: string) => fallback } },
      ],
    }).compile();

    service = moduleRef.get(WalletService);
  });

  it('getMine کیف پول رو در صورت نبود می‌سازه (upsert)', async () => {
    prisma.wallet.upsert.mockResolvedValue({ id: 'w1', balance: 0, transactions: [] });

    const result = await service.getMine('user1');

    expect(prisma.wallet.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user1' }, create: { userId: 'user1' } }),
    );
    expect(result.balance).toBe(0);
  });

  it('topup یک payment از نوع WALLET_TOPUP می‌سازه و session درگاه رو برمی‌گردونه', async () => {
    prisma.payment.create.mockResolvedValue({ id: 'p1' });
    gateway.createSession.mockResolvedValue({ paymentUrl: 'https://pay.example/y', gatewayRefId: 'ref2' });

    const result = await service.topup('user1', { amount: 100000 });

    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user1', type: 'WALLET_TOPUP', amount: 100000 }),
      }),
    );
    expect(result).toEqual({ paymentUrl: 'https://pay.example/y' });
  });
});
