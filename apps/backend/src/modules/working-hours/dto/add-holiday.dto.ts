import { IsDateString, IsOptional, MaxLength, IsString } from 'class-validator';

export class AddHolidayDto {
  @IsOptional()
  branchId?: string;

  @IsOptional()
  staffMemberId?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
