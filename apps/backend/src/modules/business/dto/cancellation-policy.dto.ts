import { IsInt, Min, Max } from 'class-validator';

export class CancellationPolicyDto {
  // چند ساعت قبل از نوبت، لغو رایگانه
  @IsInt()
  @Min(0)
  @Max(168) // حداکثر یک هفته
  freeCancelHours: number;

  // درصد جریمه در صورت لغو دیرتر از مهلت بالا
  @IsInt()
  @Min(0)
  @Max(100)
  feePercent: number;
}
