import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { AvailabilityService } from './availability.service';
import { BookingCleanupService } from './booking-cleanup.service';
import { BookingController, AvailabilityController } from './booking.controller';
import { BusinessBookingController } from './business-booking.controller';
import { CouponModule } from '../coupon/coupon.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { ReferralModule } from '../referral/referral.module';

@Module({
  imports: [CouponModule, LoyaltyModule, ReferralModule],
  controllers: [BookingController, AvailabilityController, BusinessBookingController],
  providers: [BookingService, AvailabilityService, BookingCleanupService],
  exports: [BookingService, AvailabilityService],
})
export class BookingModule {}
