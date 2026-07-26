import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CheckAvailabilityDto {
  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  staffMemberId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  // فقط تاریخ، بدون ساعت — "2026-08-01"
  @IsDateString()
  date: string;
}
