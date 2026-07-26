import { Global, Module } from '@nestjs/common';
import { PAYMENT_GATEWAY } from './payment-gateway.interface';
import { MockPaymentGateway } from './mock-payment.gateway';

@Global()
@Module({
  providers: [{ provide: PAYMENT_GATEWAY, useClass: MockPaymentGateway }],
  exports: [PAYMENT_GATEWAY],
})
export class PaymentGatewayModule {}
