import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
// ماژول‌های دامنه در فازهای بعدی این‌جا وصل میشن:
// AuthModule, UsersModule, BusinessModule, BookingModule, PaymentModule, ...

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // محدودیت نرخ درخواست پیش‌فرض سراسری (جلوگیری از brute-force/abuse)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
  ],
})
export class AppModule {}
