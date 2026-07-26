import { IsInt, Min } from 'class-validator';

export class TopupWalletDto {
  @IsInt()
  @Min(10000, { message: 'حداقل مبلغ شارژ ۱۰٬۰۰۰ تومان است' })
  amount: number;
}
