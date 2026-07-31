import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PAYMENT_GATEWAY, PaymentGateway } from '../../common/payment-gateway/payment-gateway.interface';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { BookingService } from '../booking/booking.service';

const GATEWAY_NAME = 'mock'; // بعداً 'zarinpal' جایگزین میشه

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    private readonly config: ConfigService,
    private readonly bookingService: BookingService,
  ) {}

  // ---------------------------------------------------------
  // شروع پرداخت برای یک رزرو (بیعانه)
  // ---------------------------------------------------------

  async initiate(userId: string, dto: InitiatePaymentDto) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: dto.bookingId, userId },
    });
    if (!booking) {
      throw new NotFoundException('رزرو یافت نشد');
    }
    if (booking.status !== 'PENDING') {
      throw new BadRequestException('این رزرو در وضعیت نیازمند پرداخت نیست');
    }

    const amount = Number(booking.depositRequired);
    if (amount <= 0) {
      throw new BadRequestException('مبلغ قابل پرداختی برای این رزرو وجود ندارد');
    }

    if (dto.method === 'wallet') {
      return this.payFromWallet(userId, booking.id, amount);
    }
    return this.payFromGateway(userId, booking.id, amount);
  }

  private async payFromWallet(userId: string, bookingId: string, amount: number) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || Number(wallet.balance) < amount) {
        throw new BadRequestException('موجودی کیف پول کافی نیست');
      }

      const newBalance = Number(wallet.balance) - amount;
      await tx.wallet.update({ where: { userId }, data: { balance: newBalance } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'PAYMENT',
          amount: -amount,
          balanceAfter: newBalance,
          referenceId: bookingId,
        },
      });

      const payment = await tx.payment.create({
        data: {
          bookingId,
          userId,
          type: 'DEPOSIT',
          status: 'SUCCESS',
          amount,
          gateway: 'wallet',
          callbackVerifiedAt: new Date(),
        },
      });

      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });
      await this.bookingService.awardPostPurchaseRewards(
        tx,
        userId,
        Number(booking.priceSnapshot) - Number(booking.discountAmount),
      );

      return { paidFromWallet: true, payment };
    });
  }

  private async payFromGateway(userId: string, bookingId: string, amount: number) {
    const payment = await this.prisma.payment.create({
      data: { bookingId, userId, type: 'DEPOSIT', status: 'INITIATED', amount, gateway: GATEWAY_NAME },
    });

    const callbackUrl = `${this.config.get<string>('BACKEND_PUBLIC_URL', 'http://localhost:3001')}/api/v1/payments/callback/${GATEWAY_NAME}`;
    const session = await this.gateway.createSession({
      amount,
      description: `پرداخت بیعانه رزرو ${bookingId}`,
      callbackUrl,
      internalRefId: payment.id,
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayRefId: session.gatewayRefId },
    });

    return { paidFromWallet: false, paymentUrl: session.paymentUrl };
  }

  // ---------------------------------------------------------
  // callback درگاه — همیشه با verify سرور-به-سرور، هرگز صرفاً بر
  // اساس پارامترهای query کاربر
  // ---------------------------------------------------------

  async handleCallback(gatewayName: string, gatewayRefId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { gatewayRefId, gateway: gatewayName },
    });
    if (!payment) {
      throw new NotFoundException('تراکنش یافت نشد');
    }

    // idempotency: اگر قبلاً پردازش شده، دوباره پردازش نکن (گیت‌وی‌ها
    // گاهی callback رو بیش از یک‌بار صدا می‌زنن). این چک به‌تنهایی در
    // برابر race شدید (دو callback کاملاً هم‌زمان) کامل نیست؛ خط دفاع
    // دوم اینه که verify سمت گیت‌وی واقعی (و اینجا mock) خودش
    // single-use هست — تلاش دوم برای verify همون تراکنش شکست می‌خوره.
    if (payment.status !== 'INITIATED') {
      return { alreadyProcessed: true, status: payment.status };
    }

    const verification = await this.gateway.verify(gatewayRefId, Number(payment.amount));

    if (!verification.verified) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: verification.failureReason },
      });
      return { alreadyProcessed: false, status: 'FAILED' };
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS', callbackVerifiedAt: new Date() },
      });

      if (payment.type === 'WALLET_TOPUP') {
        const wallet = await tx.wallet.findUnique({ where: { userId: payment.userId } });
        if (wallet) {
          const newBalance = Number(wallet.balance) + Number(payment.amount);
          await tx.wallet.update({ where: { userId: payment.userId }, data: { balance: newBalance } });
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'TOPUP',
              amount: Number(payment.amount),
              balanceAfter: newBalance,
              referenceId: payment.id,
            },
          });
        }
      } else if (payment.bookingId) {
        const booking = await tx.booking.findUnique({ where: { id: payment.bookingId } });
        if (booking?.status === 'PENDING') {
          await tx.booking.update({ where: { id: payment.bookingId }, data: { status: 'CONFIRMED' } });
          await this.bookingService.awardPostPurchaseRewards(
            tx,
            payment.userId,
            Number(booking.priceSnapshot) - Number(booking.discountAmount),
          );
        }
      }

      return { alreadyProcessed: false, status: 'SUCCESS' };
    });
  }

  // ---------------------------------------------------------
  // استرداد — فقط ادمین، همیشه به کیف پول کاربر (نه بازگشت مستقیم
  // به کارت، که در گیت‌وی‌های ایرانی معمولاً محدودیت/تاخیر داره)
  // ---------------------------------------------------------

  async refund(paymentId: string, adminId: string, reason: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('تراکنش یافت نشد');
    }
    if (payment.status !== 'SUCCESS') {
      throw new BadRequestException('فقط تراکنش موفق قابل استرداد است');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payment.update({ where: { id: paymentId }, data: { status: 'REFUNDED' } });

      const wallet = await tx.wallet.upsert({
        where: { userId: payment.userId },
        update: {},
        create: { userId: payment.userId },
      });
      const newBalance = Number(wallet.balance) + Number(payment.amount);
      await tx.wallet.update({ where: { userId: payment.userId }, data: { balance: newBalance } });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'REFUND',
          amount: Number(payment.amount),
          balanceAfter: newBalance,
          referenceId: payment.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'PAYMENT_REFUNDED',
          entityType: 'Payment',
          entityId: paymentId,
          metadata: { amount: Number(payment.amount), reason } as Prisma.InputJsonValue,
        },
      });

      return { refunded: true };
    });
  }
}
