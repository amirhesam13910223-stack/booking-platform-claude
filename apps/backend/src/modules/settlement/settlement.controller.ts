import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { RunSettlementDto } from './dto/run-settlement.dto';
import { BusinessRoles } from '../business/decorators/business-roles.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('businesses/:id/settlements')
export class BusinessSettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @BusinessRoles('OWNER')
  @Get()
  list(@Param('id') businessId: string) {
    return this.settlementService.listForBusiness(businessId);
  }
}

@Controller('admin/settlements')
export class AdminSettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Roles('ADMIN')
  @Post('run')
  run(@Body() dto: RunSettlementDto) {
    return this.settlementService.runBatch(dto);
  }
}
