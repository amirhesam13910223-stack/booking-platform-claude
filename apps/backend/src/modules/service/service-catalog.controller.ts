import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ServiceCatalogService } from './service-catalog.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { BusinessRoles } from '../business/decorators/business-roles.decorator';

@Controller('businesses/:id/services')
export class ServiceCatalogController {
  constructor(private readonly serviceCatalog: ServiceCatalogService) {}

  @BusinessRoles('OWNER', 'MANAGER')
  @Post()
  create(@Param('id') businessId: string, @Body() dto: CreateServiceDto) {
    return this.serviceCatalog.create(businessId, dto);
  }

  @BusinessRoles('OWNER', 'MANAGER', 'STAFF')
  @Get()
  findAll(@Param('id') businessId: string) {
    return this.serviceCatalog.findAll(businessId);
  }

  @BusinessRoles('OWNER', 'MANAGER')
  @Patch(':serviceId')
  update(
    @Param('id') businessId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.serviceCatalog.update(businessId, serviceId, dto);
  }

  @BusinessRoles('OWNER', 'MANAGER')
  @Post(':serviceId/staff/:staffMemberId')
  assignStaff(
    @Param('id') businessId: string,
    @Param('serviceId') serviceId: string,
    @Param('staffMemberId') staffMemberId: string,
  ) {
    return this.serviceCatalog.assignStaff(businessId, serviceId, staffMemberId);
  }

  @BusinessRoles('OWNER', 'MANAGER')
  @Delete(':serviceId/staff/:staffMemberId')
  unassignStaff(
    @Param('id') businessId: string,
    @Param('serviceId') serviceId: string,
    @Param('staffMemberId') staffMemberId: string,
  ) {
    return this.serviceCatalog.unassignStaff(businessId, serviceId, staffMemberId);
  }
}
