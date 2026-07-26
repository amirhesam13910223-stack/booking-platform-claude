import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { AvailabilityService } from './availability.service';
import { BookingCleanupService } from './booking-cleanup.service';
import { BookingController, AvailabilityController } from './booking.controller';
import { BusinessBookingController } from './business-booking.controller';

@Module({
  controllers: [BookingController, AvailabilityController, BusinessBookingController],
  providers: [BookingService, AvailabilityService, BookingCleanupService],
  exports: [BookingService, AvailabilityService],
})
export class BookingModule {}
