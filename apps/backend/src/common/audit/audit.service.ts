import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorId?: string;
    action: string;
    entityType: string;
    entityId: string;
    // نوع دقیق Prisma برای فیلد Json — یک Record ساده‌ی TS باهاش
    // ساختاری match نمی‌شه (چون Prisma یک union بازگشتی خاص خودش
    // برای JSON تعریف می‌کنه)، به همین دلیل باید همین تایپ رو استفاده کرد.
    metadata?: Prisma.InputJsonValue;
    ipAddress?: string;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
      },
    });
  }
}
