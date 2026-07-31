import { IsDateString, IsOptional, IsString } from 'class-validator';

export class HoldBookingDto {
  @IsString()
  businessId: string;

  @IsString()
  branchId: string;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  staffMemberId?: string;

  // زمان دقیق شروع، ISO — باید دقیقاً یکی از بازه‌های آزاد برگشتی
  // از availability باشه (سرور دوباره اعتبارسنجی می‌کنه).
  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
