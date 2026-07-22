import { Matches } from 'class-validator';

const IRAN_MOBILE_REGEX = /^09\d{9}$/;
const OTP_REGEX = /^\d{6}$/;

export class VerifyLoginOtpDto {
  @Matches(IRAN_MOBILE_REGEX, { message: 'شماره موبایل معتبر نیست' })
  phone: string;

  @Matches(OTP_REGEX, { message: 'کد تایید باید ۶ رقمی باشد' })
  code: string;
}
