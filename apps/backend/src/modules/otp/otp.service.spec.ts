import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpService } from './otp.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SMS_PROVIDER } from '../../common/sms/sms.interface';
import { TooManyRequestsException } from '../../common/exceptions/too-many-requests.exception';
import { sha256Hash } from '../../common/crypto/hash.util';

describe('OtpService', () => {
  let service: OtpService;
  let prisma: { otpCode: Record<string, jest.Mock> };
  let sms: { send: jest.Mock };

  beforeEach(async () => {
    prisma = {
      otpCode: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    sms = { send: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: prisma },
        { provide: SMS_PROVIDER, useValue: sms },
        {
          provide: ConfigService,
          useValue: { get: () => undefined }, // OTP_DEBUG_EXPOSE خاموش در تست‌ها
        },
      ],
    }).compile();

    service = moduleRef.get(OtpService);
  });

  describe('requestOtp', () => {
    it('یک OTP جدید می‌سازه و پیامک می‌فرسته', async () => {
      prisma.otpCode.findFirst.mockResolvedValue(null);

      await service.requestOtp('09121234567', 'REGISTER');

      expect(prisma.otpCode.create).toHaveBeenCalled();
      expect(sms.send).toHaveBeenCalledWith(
        '09121234567',
        expect.stringContaining('کد تایید شما'),
      );
    });

    it('اگر کمتر از ۶۰ ثانیه از درخواست قبلی گذشته باشه، رد می‌کنه', async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        createdAt: new Date(), // همین الان
      });

      await expect(service.requestOtp('09121234567', 'REGISTER')).rejects.toBeInstanceOf(
        TooManyRequestsException,
      );
      expect(prisma.otpCode.create).not.toHaveBeenCalled();
    });

    it('وقتی OTP_DEBUG_EXPOSE خاموشه، کد در پاسخ برنمی‌گرده', async () => {
      prisma.otpCode.findFirst.mockResolvedValue(null);

      const result = await service.requestOtp('09121234567', 'REGISTER');
      expect(result.debugCode).toBeUndefined();
    });
  });

  describe('verifyOtp', () => {
    it('اگه هیچ کدی برای شماره ثبت نشده باشه خطا میده', async () => {
      prisma.otpCode.findFirst.mockResolvedValue(null);

      await expect(service.verifyOtp('09121234567', 'REGISTER', '123456')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('کد منقضی‌شده رو رد می‌کنه', async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: 'otp1',
        codeHash: sha256Hash('123456'),
        expiresAt: new Date(Date.now() - 1000),
        attempts: 0,
      });

      await expect(service.verifyOtp('09121234567', 'REGISTER', '123456')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('بعد از ۵ تلاش ناموفق، حتی با کد درست هم رد می‌کنه', async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: 'otp1',
        codeHash: sha256Hash('123456'),
        expiresAt: new Date(Date.now() + 100000),
        attempts: 5,
      });

      await expect(service.verifyOtp('09121234567', 'REGISTER', '123456')).rejects.toBeInstanceOf(
        TooManyRequestsException,
      );
    });

    it('با کد اشتباه شمارنده‌ی تلاش رو افزایش می‌ده و false برمی‌گردونه', async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: 'otp1',
        codeHash: sha256Hash('123456'),
        expiresAt: new Date(Date.now() + 100000),
        attempts: 1,
      });

      const result = await service.verifyOtp('09121234567', 'REGISTER', '000000');

      expect(result).toBe(false);
      expect(prisma.otpCode.update).toHaveBeenCalledWith({
        where: { id: 'otp1' },
        data: { attempts: { increment: 1 } },
      });
    });

    it('با کد درست true برمی‌گردونه و رکورد رو consumed می‌کنه', async () => {
      prisma.otpCode.findFirst.mockResolvedValue({
        id: 'otp1',
        codeHash: sha256Hash('123456'),
        expiresAt: new Date(Date.now() + 100000),
        attempts: 0,
      });

      const result = await service.verifyOtp('09121234567', 'REGISTER', '123456');

      expect(result).toBe(true);
      expect(prisma.otpCode.update).toHaveBeenCalledWith({
        where: { id: 'otp1' },
        data: { consumedAt: expect.any(Date) },
      });
    });
  });

  describe('debugCode exposure flag', () => {
    async function buildService(env: Record<string, string>) {
      const p = { otpCode: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() } };
      const s = { send: jest.fn() };
      const moduleRef = await Test.createTestingModule({
        providers: [
          OtpService,
          { provide: PrismaService, useValue: p },
          { provide: SMS_PROVIDER, useValue: s },
          { provide: ConfigService, useValue: { get: (key: string) => env[key] } },
        ],
      }).compile();
      return moduleRef.get(OtpService);
    }

    it('با OTP_DEBUG_EXPOSE=true در dev، کد رو در پاسخ برمی‌گردونه', async () => {
      const s = await buildService({ NODE_ENV: 'development', OTP_DEBUG_EXPOSE: 'true' });
      const result = await s.requestOtp('09121234567', 'REGISTER');
      expect(result.debugCode).toMatch(/^\d{6}$/);
    });

    it('حتی با OTP_DEBUG_EXPOSE=true، در production کد رو برنمی‌گردونه', async () => {
      const s = await buildService({ NODE_ENV: 'production', OTP_DEBUG_EXPOSE: 'true' });
      const result = await s.requestOtp('09121234567', 'REGISTER');
      expect(result.debugCode).toBeUndefined();
    });
  });
});
