import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedRequestUser } from '../auth/interfaces/jwt-payload.interface';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post('validate')
  async validate(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: ValidateCouponDto) {
    const result = await this.couponService.validate(
      dto.code,
      user.id,
      dto.businessId,
      dto.purchaseAmount,
    );
    return { valid: true, discountAmount: result.discountAmount };
  }
}

@Controller('admin/coupons')
export class AdminCouponController {
  constructor(private readonly couponService: CouponService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.couponService.createGlobal(dto);
  }

  @Roles('ADMIN')
  @Get()
  list() {
    return this.couponService.listGlobal();
  }

  @Roles('ADMIN')
  @Patch(':couponId')
  update(@Param('couponId') couponId: string, @Body() dto: UpdateCouponDto) {
    return this.couponService.update(couponId, dto);
  }
}
