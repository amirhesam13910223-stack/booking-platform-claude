import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { StaffService } from './staff.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { BusinessRoles } from '../business/decorators/business-roles.decorator';

@Controller('businesses/:id/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @BusinessRoles('OWNER', 'MANAGER')
  @Post('invite')
  invite(@Param('id') businessId: string, @Body() dto: InviteStaffDto) {
    return this.staffService.invite(businessId, dto);
  }

  @BusinessRoles('OWNER', 'MANAGER', 'STAFF')
  @Get()
  findAll(@Param('id') businessId: string) {
    return this.staffService.findAll(businessId);
  }

  @BusinessRoles('OWNER', 'MANAGER')
  @Delete(':staffMemberId')
  deactivate(@Param('id') businessId: string, @Param('staffMemberId') staffMemberId: string) {
    return this.staffService.deactivate(businessId, staffMemberId);
  }
}
