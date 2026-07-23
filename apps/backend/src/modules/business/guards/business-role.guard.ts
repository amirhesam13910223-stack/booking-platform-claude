import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { BUSINESS_ROLES_KEY } from '../decorators/business-roles.decorator';
import { AuthenticatedRequestUser } from '../../auth/interfaces/jwt-payload.interface';

// این guard چک می‌کنه کاربر لاگین‌شده در همون کسب‌وکاری که در پارامتر
// مسیر (id یا businessId) اومده، نقش کافی داره یا نه — کاملاً جدا از
// GlobalRole. یک ادمین سراسری (globalRole=ADMIN) همیشه از این چک رد
// میشه چون برای پشتیبانی/بررسی باید به همه‌ی کسب‌وکارها دسترسی داشته باشه.
@Injectable()
export class BusinessRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(BUSINESS_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedRequestUser | undefined = request.user;
    const businessId: string | undefined = request.params.id ?? request.params.businessId;

    if (!user) {
      throw new ForbiddenException('دسترسی کافی برای این عملیات را ندارید');
    }
    if (user.role === 'ADMIN') {
      return true;
    }
    if (!businessId) {
      throw new ForbiddenException('شناسه‌ی کسب‌وکار در مسیر یافت نشد');
    }

    const membership = await this.prisma.staffMember.findUnique({
      where: { userId_businessId: { userId: user.id, businessId } },
    });

    if (!membership || !membership.isActive || !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('دسترسی کافی برای این عملیات را ندارید');
    }

    // در دسترس‌های بعدی (service) بدون کوئری دوباره قابل استفاده‌ست
    request.businessMembership = membership;
    return true;
  }
}
