import { Controller, Get } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedRequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('me')
  getMyCode(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.referralService.getMyCode(user.id);
  }
}
