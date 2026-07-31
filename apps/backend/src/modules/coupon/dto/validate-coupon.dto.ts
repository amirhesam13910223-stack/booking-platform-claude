import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  code: string;

  // اگه ندی، یعنی کوپن سراسری پلتفرم بررسی میشه؛ کوپن مخصوص یک
  // کسب‌وکار فقط وقتی همین businessId داده بشه معتبره.
  @IsOptional()
  @IsString()
  businessId?: string;

  @IsNumber()
  @IsPositive()
  purchaseAmount: number;
}
