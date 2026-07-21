import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// این سرویس تنها نقطه‌ی اتصال به دیتابیس در کل اپلیکیشنه.
// از طریق DI به تمام ماژول‌های دیگه تزریق میشه.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
