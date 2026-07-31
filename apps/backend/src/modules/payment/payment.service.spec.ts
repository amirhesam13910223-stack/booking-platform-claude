import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PAYMENT_GATEWAY } from '../../common/payment-gateway/payment-gateway.interface';
import { ConfigService } from '@nestjs/config';
import { BookingService } from '../booking/booking.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: {
    booking: Record<string, jest.Mock>;
    payment: Record<string, jest.Mock>;
    wallet: Record<string, jest.Mock>;
    walletTransaction: Record<string, jest.Mock>;
    auditLog: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let gateway: { createSession: jest.Mock; verify: jest.Mock };
  let bookingService: { awardPostPurchaseRewards: jest.Mock };

  beforeEach(async () => {
    prisma = {
      booking: { findFirst: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
      payment: { create: jest.fn(), update: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn() },
      wallet: { findUnique: jest.fn(), update: jest.fn(), upsert: jest.fn() },
      walletTransaction: { create: jest.fn() },
      auditLog: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    gateway = { createSession: jest.fn(), verify: jest.fn() };
    bookingService = { awardPostPurchaseRewards: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: PAYMENT_GATEWAY, useValue: gateway },
        { provide: BookingService, useValue: bookingService },
        { provide: ConfigService, useValue: { get: (_k: string, fallback?: string) => fallback } },
      ],
    }).compile();

    service = moduleRef.get(PaymentService);
  });

  describe('initiate', () => {
    it('رزروی که مال کاربر نیست یا وجود نداره رو رد می‌کنه', async () => {
      prisma.booking.findFirst.mockResolvedValue(null);

      await expect(
        service.initiate('user1', { bookingId: 'b1', method: 'wallet' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('رزرو غیر-PENDING رو رد می‌کنه', async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: 'b1', status: 'CONFIRMED', depositRequired: 50000 });

      await expect(
        service.initiate('user1', { bookingId: 'b1', method: 'wallet' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('بیعانه‌ی صفر رو رد می‌کنه', async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: 'b1', status: 'PENDING', depositRequired: 0 });

      await expect(
        service.initiate('user1', { bookingId: 'b1', method: 'wallet' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('پرداخت از کیف پول با موجودی ناکافی رو رد می‌کنه', async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: 'b1', status: 'PENDING', depositRequired: 50000 });
      const tx = { wallet: { findUnique: jest.fn().mockResolvedValue({ id: 'w1', balance: 10000 }) } };
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(tx));

      await expect(
        service.initiate('user1', { bookingId: 'b1', method: 'wallet' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('پرداخت موفق از کیف پول: موجودی کم میشه، رزرو CONFIRMED میشه، و پاداش خرید اهدا میشه', async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: 'b1', status: 'PENDING', depositRequired: 50000 });
      const tx = {
        wallet: {
          findUnique: jest.fn().mockResolvedValue({ id: 'w1', balance: 100000 }),
          update: jest.fn(),
        },
        walletTransaction: { create: jest.fn() },
        payment: { create: jest.fn().mockResolvedValue({ id: 'p1', status: 'SUCCESS' }) },
        booking: {
          update: jest
            .fn()
            .mockResolvedValue({ id: 'b1', priceSnapshot: 250000, discountAmount: 0 }),
        },
      };
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(tx));

      const result = await service.initiate('user1', { bookingId: 'b1', method: 'wallet' });

      expect(tx.wallet.update).toHaveBeenCalledWith({ where: { userId: 'user1' }, data: { balance: 50000 } });
      expect(tx.booking.update).toHaveBeenCalledWith({ where: { id: 'b1' }, data: { status: 'CONFIRMED' } });
      expect(bookingService.awardPostPurchaseRewards).toHaveBeenCalledWith(tx, 'user1', 250000);
      expect(result.paidFromWallet).toBe(true);
    });

    it('پرداخت از درگاه: session می‌سازه و paymentUrl برمی‌گردونه', async () => {
      prisma.booking.findFirst.mockResolvedValue({ id: 'b1', status: 'PENDING', depositRequired: 50000 });
      prisma.payment.create.mockResolvedValue({ id: 'p1' });
      gateway.createSession.mockResolvedValue({ paymentUrl: 'https://pay.example/x', gatewayRefId: 'ref1' });

      const result = await service.initiate('user1', { bookingId: 'b1', method: 'gateway' });

      expect(gateway.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 50000, internalRefId: 'p1' }),
      );
      expect(result).toEqual({ paidFromWallet: false, paymentUrl: 'https://pay.example/x' });
    });
  });

  describe('handleCallback — idempotency و verify سرور-به-سرور', () => {
    it('تراکنش ناموجود رو رد می‌کنه', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.handleCallback('mock', 'ref1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('تراکنشی که قبلاً پردازش شده رو دوباره پردازش نمی‌کنه (idempotency)', async () => {
      prisma.payment.findFirst.mockResolvedValue({ id: 'p1', status: 'SUCCESS' });

      const result = await service.handleCallback('mock', 'ref1');

      expect(result).toEqual({ alreadyProcessed: true, status: 'SUCCESS' });
      expect(gateway.verify).not.toHaveBeenCalled();
    });

    it('verify ناموفق رو FAILED می‌کنه، نه SUCCESS', async () => {
      prisma.payment.findFirst.mockResolvedValue({ id: 'p1', status: 'INITIATED', amount: 50000 });
      gateway.verify.mockResolvedValue({ verified: false, failureReason: 'مبلغ نامعتبر' });

      const result = await service.handleCallback('mock', 'ref1');

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
      );
      expect(result.status).toBe('FAILED');
    });

    it('verify موفق برای بیعانه‌ی رزرو، رزرو رو CONFIRMED می‌کنه و پاداش خرید اهدا میشه', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'p1',
        status: 'INITIATED',
        amount: 50000,
        type: 'DEPOSIT',
        bookingId: 'b1',
        userId: 'user1',
      });
      gateway.verify.mockResolvedValue({ verified: true });
      const tx = {
        payment: { update: jest.fn() },
        booking: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 'b1', status: 'PENDING', priceSnapshot: 250000, discountAmount: 0 }),
          update: jest.fn(),
        },
      };
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(tx));

      const result = await service.handleCallback('mock', 'ref1');

      expect(tx.booking.update).toHaveBeenCalledWith({ where: { id: 'b1' }, data: { status: 'CONFIRMED' } });
      expect(bookingService.awardPostPurchaseRewards).toHaveBeenCalledWith(tx, 'user1', 250000);
      expect(result.status).toBe('SUCCESS');
    });

    it('verify موفق برای شارژ کیف پول، موجودی رو اضافه می‌کنه', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'p1',
        status: 'INITIATED',
        amount: 100000,
        type: 'WALLET_TOPUP',
        userId: 'user1',
      });
      gateway.verify.mockResolvedValue({ verified: true });
      const tx = {
        payment: { update: jest.fn() },
        wallet: {
          findUnique: jest.fn().mockResolvedValue({ id: 'w1', balance: 20000 }),
          update: jest.fn(),
        },
        walletTransaction: { create: jest.fn() },
      };
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(tx));

      await service.handleCallback('mock', 'ref1');

      expect(tx.wallet.update).toHaveBeenCalledWith({ where: { userId: 'user1' }, data: { balance: 120000 } });
    });
  });

  describe('refund', () => {
    it('تراکنش ناموفق (غیر SUCCESS) رو رد می‌کنه', async () => {
      prisma.payment.findUnique.mockResolvedValue({ id: 'p1', status: 'INITIATED' });

      await expect(service.refund('p1', 'admin1', 'دلیل تست')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('استرداد موفق، مبلغ رو به کیف پول کاربر برمی‌گردونه', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'SUCCESS',
        amount: 50000,
        userId: 'user1',
      });
      const tx = {
        payment: { update: jest.fn() },
        wallet: {
          upsert: jest.fn().mockResolvedValue({ id: 'w1', balance: 10000 }),
          update: jest.fn(),
        },
        walletTransaction: { create: jest.fn() },
        auditLog: { create: jest.fn() },
      };
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(tx));

      const result = await service.refund('p1', 'admin1', 'رضایت مشتری');

      expect(tx.wallet.update).toHaveBeenCalledWith({ where: { userId: 'user1' }, data: { balance: 60000 } });
      expect(tx.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'PAYMENT_REFUNDED' }),
        }),
      );
      expect(result.refunded).toBe(true);
    });
  });
});
