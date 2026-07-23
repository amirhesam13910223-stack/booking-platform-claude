import { IsArray, IsInt, IsOptional, Matches, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm

class WorkingHourEntryDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0=یکشنبه ... 6=شنبه

  @Matches(TIME_REGEX, { message: 'فرمت ساعت شروع باید HH:mm باشد' })
  startTime: string;

  @Matches(TIME_REGEX, { message: 'فرمت ساعت پایان باید HH:mm باشد' })
  endTime: string;
}

// یا branchId یا staffMemberId باید ست بشه، نه هردو — سطح کنترلر/سرویس چک میشه.
export class SetWorkingHoursDto {
  @IsOptional()
  branchId?: string;

  @IsOptional()
  staffMemberId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourEntryDto)
  hours: WorkingHourEntryDto[];
}
