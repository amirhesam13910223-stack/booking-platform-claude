import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { BusinessRoles } from '../business/decorators/business-roles.decorator';

@Controller('businesses/:id/coupons')
export class BusinessCouponController {
  constructor(private readonly couponService: CouponService) {}

  @BusinessRoles('OWNER', 'MANAGER')
  @Post()
  create(@Param('id') businessId: string, @Body() dto: CreateCouponDto) {
    return this.couponService.createForBusiness(businessId, dto);
  }

  @BusinessRoles('OWNER', 'MANAGER')
  @Get()
  list(@Param('id') businessId: string) {
    return this.couponService.listForBusiness(businessId);
  }

  @BusinessRoles('OWNER', 'MANAGER')
  @Patch(':couponId')
  update(@Param('couponId') couponId: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.update(couponId, dto);
  }
}
