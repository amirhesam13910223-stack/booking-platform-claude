import { IsIn } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsIn(['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'])
  status: 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
}
