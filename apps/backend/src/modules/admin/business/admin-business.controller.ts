import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BusinessService } from '../../business/business.service';
import { ReasonDto } from '../../business/dto/reason.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthenticatedRequestUser } from '../../auth/interfaces/jwt-payload.interface';

// این کنترلر با @Roles('ADMIN') محافظت میشه — کاملاً جدا از
// BusinessRoleGuard (که سطح یک کسب‌وکار خاصه)، این‌جا GlobalRole
// سراسری پلتفرم چک میشه.
@Roles('ADMIN')
@Controller('admin/businesses')
export class AdminBusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  listPending() {
    return this.businessService.listPendingForAdmin();
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() admin: AuthenticatedRequestUser) {
    return this.businessService.approve(id, admin.id);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: ReasonDto,
    @CurrentUser() admin: AuthenticatedRequestUser,
  ) {
    return this.businessService.reject(id, admin.id, dto.reason);
  }

  @Post(':id/suspend')
  suspend(
    @Param('id') id: string,
    @Body() dto: ReasonDto,
    @CurrentUser() admin: AuthenticatedRequestUser,
  ) {
    return this.businessService.suspend(id, admin.id, dto.reason);
  }
}
