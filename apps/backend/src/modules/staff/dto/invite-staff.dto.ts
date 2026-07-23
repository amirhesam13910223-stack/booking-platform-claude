import { IsIn, Matches, IsOptional, MaxLength, IsString } from 'class-validator';

const IRAN_MOBILE_REGEX = /^09\d{9}$/;

export class InviteStaffDto {
  @Matches(IRAN_MOBILE_REGEX, { message: 'شماره موبایل معتبر نیست' })
  phone: string;

  @IsIn(['MANAGER', 'STAFF'])
  role: 'MANAGER' | 'STAFF';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string;

  @IsOptional()
  branchId?: string;
}
