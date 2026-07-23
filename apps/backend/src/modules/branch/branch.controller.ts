import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BusinessRoles } from '../business/decorators/business-roles.decorator';

@Controller('businesses/:id/branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @BusinessRoles('OWNER', 'MANAGER')
  @Post()
  create(@Param('id') businessId: string, @Body() dto: CreateBranchDto) {
    return this.branchService.create(businessId, dto);
  }

  @BusinessRoles('OWNER', 'MANAGER', 'STAFF')
  @Get()
  findAll(@Param('id') businessId: string) {
    return this.branchService.findAll(businessId);
  }

  @BusinessRoles('OWNER', 'MANAGER')
  @Patch(':branchId')
  update(
    @Param('id') businessId: string,
    @Param('branchId') branchId: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchService.update(businessId, branchId, dto);
  }
}
