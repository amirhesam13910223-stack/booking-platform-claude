import { IsString, MinLength } from 'class-validator';

export class RefundPaymentDto {
  @IsString()
  @MinLength(5, { message: 'دلیل استرداد باید حداقل ۵ کاراکتر باشد' })
  reason: string;
}
