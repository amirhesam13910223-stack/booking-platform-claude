import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PAYMENT_GATEWAY, PaymentGateway } from '../../common/payment-gateway/payment-gateway.interface';
import { TopupWalletDto } from './dto/topup-wallet.dto';

const GATEWAY_NAME = 'mock';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
    private readonly config: ConfigService,
  ) {}

  async getMine(userId: string) {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    return wallet;
  }

  async topup(userId: string, dto: TopupWalletDto) {
    const payment = await this.prisma.payment.create({
      data: { userId, type: 'WALLET_TOPUP', status: 'INITIATED', amount: dto.amount, gateway: GATEWAY_NAME },
    });

    const callbackUrl = `${this.config.get<string>('BACKEND_PUBLIC_URL', 'http://localhost:3001')}/api/v1/payments/callback/${GATEWAY_NAME}`;
    const session = await this.gateway.createSession({
      amount: dto.amount,
      description: 'شارژ کیف پول',
      callbackUrl,
      internalRefId: payment.id,
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayRefId: session.gatewayRefId },
    });

    return { paymentUrl: session.paymentUrl };
  }
}
