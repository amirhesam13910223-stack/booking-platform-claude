import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { SmsModule } from './common/sms/sms.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
// ماژول‌های دامنه‌ی بعدی (فاز ۲ به بعد) این‌جا اضافه میشن:
// BusinessModule, BookingModule, PaymentModule, ...

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => [{ ttl: 60000, limit: 100 }],
    }),
    PrismaModule,
    SmsModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    // ترتیب مهمه: اول احراز هویت (کاربر کیه)، بعد نقش (چه کاری مجازه)،
    // بعد rate limit. هر سه به‌صورت سراسری روی تمام route ها اعمال میشن
    // مگر با @Public()/@Roles() آزاد بشن.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
