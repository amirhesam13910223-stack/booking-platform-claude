import { IsDateString, IsOptional, IsString } from 'class-validator';

export class RunSettlementDto {
  // اگر ندی، برای همه‌ی کسب‌وکارهای فعال محاسبه میشه
  @IsOptional()
  @IsString()
  businessId?: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}
