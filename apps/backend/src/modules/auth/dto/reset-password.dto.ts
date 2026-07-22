import { Matches } from 'class-validator';

const IRAN_MOBILE_REGEX = /^09\d{9}$/;
const OTP_REGEX = /^\d{6}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export class ResetPasswordDto {
  @Matches(IRAN_MOBILE_REGEX, { message: 'شماره موبایل معتبر نیست' })
  phone: string;

  @Matches(OTP_REGEX, { message: 'کد تایید باید ۶ رقمی باشد' })
  code: string;

  @Matches(PASSWORD_REGEX, {
    message: 'رمز عبور باید حداقل ۸ کاراکتر و شامل حرف و عدد باشد',
  })
  newPassword: string;
}
