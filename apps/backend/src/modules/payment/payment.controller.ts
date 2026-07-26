import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedRequestUser } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  initiate(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: InitiatePaymentDto) {
    return this.paymentService.initiate(user.id, dto);
  }

  // این endpoint رو خود درگاه پرداخت صدا می‌زنه (بعد از کارت‌کشی
  // کاربر) — به همین دلیل باید عمومی باشه؛ امنیتش با verify
  // سرور-به-سرور در PaymentService تامین میشه، نه با احراز هویت کاربر.
  @Public()
  @Get('callback/:gateway')
  callback(@Param('gateway') gateway: string, @Query('gatewayRefId') gatewayRefId: string) {
    return this.paymentService.handleCallback(gateway, gatewayRefId);
  }

  @Roles('ADMIN')
  @Post(':id/refund')
  refund(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentService.refund(id, user.id, dto.reason);
  }
}
