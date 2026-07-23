import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { WorkingHoursService } from './working-hours.service';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto';
import { AddHolidayDto } from './dto/add-holiday.dto';
import { BusinessRoles } from '../business/decorators/business-roles.decorator';

@Controller('businesses/:id')
export class WorkingHoursController {
  constructor(private readonly workingHoursService: WorkingHoursService) {}

  @BusinessRoles('OWNER', 'MANAGER')
  @Put('working-hours')
  setWorkingHours(@Param('id') businessId: string, @Body() dto: SetWorkingHoursDto) {
    return this.workingHoursService.setWorkingHours(businessId, dto);
  }

  @BusinessRoles('OWNER', 'MANAGER')
  @Post('holidays')
  addHoliday(@Param('id') businessId: string, @Body() dto: AddHolidayDto) {
    return this.workingHoursService.addHoliday(businessId, dto);
  }

  @BusinessRoles('OWNER', 'MANAGER', 'STAFF')
  @Get('holidays')
  listHolidays(
    @Param('id') businessId: string,
    @Query('branchId') branchId?: string,
    @Query('staffMemberId') staffMemberId?: string,
  ) {
    return this.workingHoursService.listHolidays(businessId, branchId, staffMemberId);
  }
}
