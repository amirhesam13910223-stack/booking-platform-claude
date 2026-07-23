import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { CancellationPolicyDto } from './dto/cancellation-policy.dto';
import { AddDocumentDto } from './dto/add-document.dto';
import { BusinessRoles } from './decorators/business-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedRequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('businesses')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  // هر کاربر لاگین‌شده می‌تونه یک کسب‌وکار جدید بسازه — خودش
  // به‌صورت خودکار OWNER همون کسب‌وکار میشه.
  @Post()
  create(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: CreateBusinessDto) {
    return this.businessService.create(user.id, dto);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.businessService.findMine(user.id);
  }

  @BusinessRoles('OWNER', 'MANAGER', 'STAFF')
  @Get(':id')
  findOneForOwner(@Param('id') id: string) {
    return this.businessService.findOneForOwner(id);
  }

  @BusinessRoles('OWNER', 'MANAGER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return this.businessService.update(id, dto);
  }

  @BusinessRoles('OWNER')
  @Put(':id/cancellation-policy')
  updateCancellationPolicy(@Param('id') id: string, @Body() dto: CancellationPolicyDto) {
    return this.businessService.updateCancellationPolicy(id, dto);
  }

  @BusinessRoles('OWNER')
  @Post(':id/documents')
  addDocument(@Param('id') id: string, @Body() dto: AddDocumentDto) {
    return this.businessService.addDocument(id, dto.type, dto.fileUrl);
  }
}
