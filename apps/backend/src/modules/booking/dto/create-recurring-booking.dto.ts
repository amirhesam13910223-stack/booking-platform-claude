import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRecurringBookingDto {
  @IsString()
  businessId: string;

  @IsString()
  branchId: string;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  staffMemberId?: string;

  @IsDateString()
  startTime: string; // اولین نوبت

  @IsInt()
  @Min(2, { message: 'رزرو تکرارشونده حداقل باید ۲ جلسه باشد' })
  @Max(52, { message: 'حداکثر یک سال (۵۲ هفته) پشتیبانی می‌شود' })
  @Type(() => Number)
  occurrences: number;

  // فعلاً فقط تکرار هفتگی پشتیبانی میشه — پایه‌ی ساده و قابل‌اعتماد
  // برای شروع؛ الگوهای دیگه (روزانه/ماهانه) بهبود آینده‌ست.
}
