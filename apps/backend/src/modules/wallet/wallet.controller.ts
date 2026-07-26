import { Body, Controller, Get, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TopupWalletDto } from './dto/topup-wallet.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedRequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.walletService.getMine(user.id);
  }

  @Post('topup')
  topup(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: TopupWalletDto) {
    return this.walletService.topup(user.id, dto);
  }
}
