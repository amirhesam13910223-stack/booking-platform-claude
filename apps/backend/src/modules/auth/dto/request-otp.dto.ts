import { Matches } from 'class-validator';

// شماره موبایل ایران: 09xxxxxxxxx
const IRAN_MOBILE_REGEX = /^09\d{9}$/;

export class RequestOtpDto {
  @Matches(IRAN_MOBILE_REGEX, { message: 'شماره موبایل معتبر نیست' })
  phone: string;
}

export class RequestLoginOtpDto extends RequestOtpDto {}

export class ForgotPasswordDto extends RequestOtpDto {}
