import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { AvailabilityService } from './availability.service';
import { HoldBookingDto } from './dto/hold-booking.dto';
import { CreateRecurringBookingDto } from './dto/create-recurring-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedRequestUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Post('hold')
  hold(@CurrentUser() user: AuthenticatedRequestUser, @Body() dto: HoldBookingDto) {
    return this.bookingService.hold(user.id, dto);
  }

  @Post('recurring')
  createRecurring(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() dto: CreateRecurringBookingDto,
  ) {
    return this.bookingService.createRecurring(user.id, dto);
  }

  @Post(':id/confirm')
  confirm(@CurrentUser() user: AuthenticatedRequestUser, @Param('id') id: string) {
    return this.bookingService.confirm(id, user.id);
  }

  @Post('recurring/:groupId/confirm')
  confirmGroup(@CurrentUser() user: AuthenticatedRequestUser, @Param('groupId') groupId: string) {
    return this.bookingService.confirmGroup(groupId, user.id);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancelByUser(id, user.id, dto);
  }

  @Post(':id/reschedule')
  reschedule(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto,
  ) {
    return this.bookingService.reschedule(id, user.id, dto);
  }

  @Get('me')
  listMine(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.bookingService.listMine(user.id);
  }
}

// این کنترلر عمداً جداست: مسیر جستجوی زمان آزاد باید عمومی
// (بدون لاگین) در دسترس باشه تا کاربر مهمان هم بتونه قبل از
// ثبت‌نام زمان‌های آزاد رو ببینه — درست مثل discover/businesses.
@Controller('discover/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Public()
  @Get(':businessId')
  getFreeSlots(
    @Param('businessId') businessId: string,
    @Query() query: CheckAvailabilityDto,
  ) {
    return this.availabilityService.getFreeSlots(businessId, query);
  }
}
