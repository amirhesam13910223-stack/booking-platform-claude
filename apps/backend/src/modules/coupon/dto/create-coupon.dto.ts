import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsPositive, Matches, Min } from 'class-validator';

export class CreateCouponDto {
  @Matches(/^[A-Z0-9_-]{3,30}$/, { message: 'کد کوپن باید ۳ تا ۳۰ کاراکتر (حروف بزرگ انگلیسی/عدد/خط تیره) باشد' })
  code: string;

  @IsIn(['PERCENTAGE', 'FIXED_AMOUNT'])
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';

  @IsNumber()
  @IsPositive()
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPurchase?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validTo: string;
}
