import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { ListBusinessBookingsDto } from './dto/list-business-bookings.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { BusinessRoles } from '../business/decorators/business-roles.decorator';

@Controller('businesses/:id/bookings')
export class BusinessBookingController {
  constructor(private readonly bookingService: BookingService) {}

  @BusinessRoles('OWNER', 'MANAGER', 'STAFF')
  @Get()
  list(@Param('id') businessId: string, @Query() query: ListBusinessBookingsDto) {
    return this.bookingService.listForBusiness(businessId, query);
  }

  @BusinessRoles('OWNER', 'MANAGER')
  @Patch(':bookingId/status')
  updateStatus(
    @Param('id') businessId: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateStatus(businessId, bookingId, dto);
  }

  @BusinessRoles('OWNER', 'MANAGER')
  @Post(':bookingId/cancel')
  cancel(
    @Param('id') businessId: string,
    @Param('bookingId') bookingId: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancelByBusiness(businessId, bookingId, dto);
  }
}
