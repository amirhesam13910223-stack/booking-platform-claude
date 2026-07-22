import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedRequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  updateProfile(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('me/sessions')
  listSessions(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.usersService.listSessions(user.id);
  }

  @Delete('me/sessions/:id')
  revokeSession(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') sessionId: string) {
    return this.usersService.revokeSession(user.id, sessionId);
  }

  @Delete('me')
  deleteAccount(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.usersService.requestAccountDeletion(user.id);
  }
}
