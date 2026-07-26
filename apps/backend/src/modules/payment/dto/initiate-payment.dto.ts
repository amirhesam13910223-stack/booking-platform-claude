import { IsIn, IsString } from 'class-validator';

export class InitiatePaymentDto {
  @IsString()
  bookingId: string;

  @IsIn(['gateway', 'wallet'])
  method: 'gateway' | 'wallet';
}
