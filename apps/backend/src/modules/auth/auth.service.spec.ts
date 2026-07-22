import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { hashPassword } from '../../common/crypto/hash.util';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: Record<string, jest.Mock>;
    wallet: Record<string, jest.Mock>;
    loyaltyAccount: Record<string, jest.Mock>;
    refreshToken: Record<string, jest.Mock>;
  };
  let otp: { requestOtp: jest.Mock; verifyOtp: jest.Mock };

  const ctx = { deviceInfo: 'jest-test-agent', ipAddress: '127.0.0.1' };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      wallet: { create: jest.fn() },
      loyaltyAccount: { create: jest.fn() },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    otp = { requestOtp: jest.fn(), verifyOtp: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: OtpService, useValue: otp },
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) =>
              key === 'JWT_ACCESS_SECRET' ? 'test-access-secret' : 'test-value',
            get: (_key: string, fallback?: string) => fallback,
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('requestRegisterOtp', () => {
    it('اجازه‌ی ثبت‌نام دوباره با شماره‌ی تکراری رو نمی‌ده', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', phone: '09120000000' });

      await expect(service.requestRegisterOtp('09120000000')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(otp.requestOtp).not.toHaveBeenCalled();
    });

    it('برای شماره‌ی جدید OTP درخواست می‌کنه', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await service.requestRegisterOtp('09121234567');
      expect(otp.requestOtp).toHaveBeenCalledWith('09121234567', 'REGISTER');
    });
  });

  describe('verifyRegisterAndCreateUser', () => {
    it('با کد اشتباه کاربر نمی‌سازه', async () => {
      otp.verifyOtp.mockResolvedValue(false);

      await expect(
        service.verifyRegisterAndCreateUser(
          { phone: '09121234567', code: '000000', fullName: 'تست', password: 'Password1' },
          ctx,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('با کد درست کاربر و کیف پول و loyalty account می‌سازه و توکن برمی‌گردونه', async () => {
      otp.verifyOtp.mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(null); // چک race condition
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        globalRole: 'USER',
        phone: '09121234567',
      });

      const result = await service.verifyRegisterAndCreateUser(
        { phone: '09121234567', code: '123456', fullName: 'تست', password: 'Password1' },
        ctx,
      );

      expect(prisma.wallet.create).toHaveBeenCalledWith({ data: { userId: 'u1' } });
      expect(prisma.loyaltyAccount.create).toHaveBeenCalledWith({ data: { userId: 'u1' } });
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toHaveLength(96); // 48 بایت hex
    });
  });

  describe('loginWithPassword', () => {
    it('با کاربر ناموجود پیام یکسان (نه lo user enumeration) میده', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.loginWithPassword({ phone: '09120000000', password: 'x' }, ctx),
      ).rejects.toThrow('شماره یا رمز عبور نادرست است');
    });

    it('با رمز اشتباه اجازه‌ی ورود نمی‌ده', async () => {
      const passwordHash = await hashPassword('CorrectPass1');
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        status: 'ACTIVE',
        passwordHash,
        globalRole: 'USER',
      });

      await expect(
        service.loginWithPassword({ phone: '09120000000', password: 'WrongPass1' }, ctx),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('با رمز درست توکن صادر می‌کنه', async () => {
      const passwordHash = await hashPassword('CorrectPass1');
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        status: 'ACTIVE',
        passwordHash,
        globalRole: 'USER',
      });

      const result = await service.loginWithPassword(
        { phone: '09120000000', password: 'CorrectPass1' },
        ctx,
      );
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('کاربر SUSPENDED نباید بتونه لاگین کنه', async () => {
      const passwordHash = await hashPassword('CorrectPass1');
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        status: 'SUSPENDED',
        passwordHash,
        globalRole: 'USER',
      });

      await expect(
        service.loginWithPassword({ phone: '09120000000', password: 'CorrectPass1' }, ctx),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('توکن منقضی‌شده رو رد می‌کنه', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1000), // در گذشته
      });

      await expect(service.refreshTokens('some-raw-token', ctx)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('توکن باطل‌شده (revoked) رو رد می‌کنه', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(service.refreshTokens('some-raw-token', ctx)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('در حالت معتبر، توکن قدیمی رو باطل و جفت جدید صادر می‌کنه (rotation)', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 100000),
      });
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', status: 'ACTIVE', globalRole: 'USER' });

      const result = await service.refreshTokens('some-raw-token', ctx);

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result.accessToken).toBeDefined();
    });
  });

  describe('resetPassword', () => {
    it('بعد از تغییر رمز، تمام نشست‌های فعال رو باطل می‌کنه', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      otp.verifyOtp.mockResolvedValue(true);

      await service.resetPassword({
        phone: '09120000000',
        code: '123456',
        newPassword: 'NewPassword1',
      });

      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
