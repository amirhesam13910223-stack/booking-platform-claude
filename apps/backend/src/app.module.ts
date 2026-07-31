import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { SmsModule } from './common/sms/sms.module';
import { AuditModule } from './common/audit/audit.module';
import { RedisModule } from './common/redis/redis.module';
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
import { BookingModule } from './modules/booking/booking.module';
import { PaymentGatewayModule } from './common/payment-gateway/payment-gateway.module';
import { PaymentModule } from './modules/payment/payment.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { SettlementModule } from './modules/settlement/settlement.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { ReferralModule } from './modules/referral/referral.module';
// ماژول‌های دامنه‌ی بعدی (فاز ۶ به بعد) این‌جا اضافه میشن:
// ReviewModule, NotificationModule, ...

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => [{ ttl: 60000, limit: 100 }],
    }),
    PrismaModule,
    SmsModule,
    AuditModule,
    RedisModule,
    AuthModule,
    UsersModule,
    BusinessModule,
    BranchModule,
    ServiceCatalogModule,
    StaffModule,
    WorkingHoursModule,
    DiscoveryModule,
    AdminBusinessModule,
    BookingModule,
    PaymentGatewayModule,
    PaymentModule,
    WalletModule,
    SettlementModule,
    CouponModule,
    LoyaltyModule,
    ReferralModule,
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
