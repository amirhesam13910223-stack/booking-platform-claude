import { Controller, Get } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedRequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.loyaltyService.getMine(user.id);
  }
}
