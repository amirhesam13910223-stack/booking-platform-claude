import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { BusinessCouponController } from './business-coupon.controller';
import { CouponController, AdminCouponController } from './coupon.controller';

@Module({
  controllers: [BusinessCouponController, CouponController, AdminCouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
