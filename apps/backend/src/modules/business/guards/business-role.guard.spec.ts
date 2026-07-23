import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { BusinessRoleGuard } from './business-role.guard';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('BusinessRoleGuard', () => {
  let guard: BusinessRoleGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let prisma: { staffMember: { findUnique: jest.Mock } };

  const buildContext = (user: unknown, params: Record<string, string>): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    reflector = { getAllAndOverride: jest.fn() };
    prisma = { staffMember: { findUnique: jest.fn() } };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BusinessRoleGuard,
        { provide: Reflector, useValue: reflector },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    guard = moduleRef.get(BusinessRoleGuard);
  });

  it('اگر @BusinessRoles تنظیم نشده باشه، اجازه‌ی عبور می‌ده', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const ctx = buildContext({ id: 'u1', role: 'USER' }, { id: 'biz1' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.staffMember.findUnique).not.toHaveBeenCalled();
  });

  it('کاربر لاگین‌نشده رو رد می‌کنه', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER']);
    const ctx = buildContext(undefined, { id: 'biz1' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('ادمین سراسری همیشه از این guard رد می‌شه، بدون نیاز به membership', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER']);
    const ctx = buildContext({ id: 'admin1', role: 'ADMIN' }, { id: 'biz1' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.staffMember.findUnique).not.toHaveBeenCalled();
  });

  it('کاربری که عضو این کسب‌وکار نیست رو رد می‌کنه', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER', 'MANAGER']);
    prisma.staffMember.findUnique.mockResolvedValue(null);
    const ctx = buildContext({ id: 'u1', role: 'USER' }, { id: 'biz1' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('کارمند غیرفعال (isActive=false) رو حتی با نقش درست رد می‌کنه', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER']);
    prisma.staffMember.findUnique.mockResolvedValue({ role: 'OWNER', isActive: false });
    const ctx = buildContext({ id: 'u1', role: 'USER' }, { id: 'biz1' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('کارمندی با نقش پایین‌تر از حد لازم رو رد می‌کنه (STAFF برای عملیات OWNER-only)', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER']);
    prisma.staffMember.findUnique.mockResolvedValue({ role: 'STAFF', isActive: true });
    const ctx = buildContext({ id: 'u1', role: 'USER' }, { id: 'biz1' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('صاحب کسب‌وکار (OWNER) فعال با نقش درست اجازه‌ی عبور می‌گیره', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER', 'MANAGER']);
    prisma.staffMember.findUnique.mockResolvedValue({ role: 'OWNER', isActive: true });
    const ctx = buildContext({ id: 'u1', role: 'USER' }, { id: 'biz1' });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('اگر businessId در پارامتر مسیر نباشه، خطا می‌ده', async () => {
    reflector.getAllAndOverride.mockReturnValue(['OWNER']);
    const ctx = buildContext({ id: 'u1', role: 'USER' }, {});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
