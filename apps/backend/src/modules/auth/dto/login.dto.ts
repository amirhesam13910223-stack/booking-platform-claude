import { IsString, Matches } from 'class-validator';

const IRAN_MOBILE_REGEX = /^09\d{9}$/;

export class LoginDto {
  @Matches(IRAN_MOBILE_REGEX, { message: 'شماره موبایل معتبر نیست' })
  phone: string;

  @IsString()
  password: string;
}
