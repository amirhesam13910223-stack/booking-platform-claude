import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { SmsModule } from './common/sms/sms.module';
import { AuditModule } from './common/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { BusinessRoleGuard } from './modules/business/guards/business-role.guard';
import { BusinessModule } from './modules/business/business.module';
import { BranchModule } from './modules/branch/branch.module';
import { ServiceCatalogModule } from './modules/service/service-catalog.module';
import { StaffModule } from './modules/staff/staff.module';
import { WorkingHoursModule } from './modules/working-hours/working-hours.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { AdminBusinessModule } from './modules/admin/business/admin-business.module';
// ماژول‌های دامنه‌ی بعدی (فاز ۳ به بعد) این‌جا اضافه میشن:
// BookingModule, PaymentModule, ...

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => [{ ttl: 60000, limit: 100 }],
    }),
    PrismaModule,
    SmsModule,
    AuditModule,
    AuthModule,
    UsersModule,
    BusinessModule,
    BranchModule,
    ServiceCatalogModule,
    StaffModule,
    WorkingHoursModule,
    DiscoveryModule,
    AdminBusinessModule,
  ],
  providers: [
    // ترتیب مهمه: اول احراز هویت (کاربر کیه)، بعد نقش سراسری (ادمین یا نه)،
    // بعد نقش سطح کسب‌وکار (نیاز به request.user داره که باید توسط
    // JwtAuthGuard قبلش ست شده باشه — به همین دلیل همه‌ی این چهار
    // guard صراحتاً این‌جا و به همین ترتیب ثبت میشن، نه پخش‌شده در
    // ماژول‌های مختلف که ترتیب اجراشون تضمین‌شده نیست)، بعد rate limit.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: BusinessRoleGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
