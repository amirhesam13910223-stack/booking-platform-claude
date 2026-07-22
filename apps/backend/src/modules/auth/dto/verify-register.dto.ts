import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

const IRAN_MOBILE_REGEX = /^09\d{9}$/;
const OTP_REGEX = /^\d{6}$/;
// حداقل ۸ کاراکتر، حداقل یک حرف و یک عدد — سیاست پسورد پایه.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export class VerifyRegisterDto {
  @Matches(IRAN_MOBILE_REGEX, { message: 'شماره موبایل معتبر نیست' })
  phone: string;

  @Matches(OTP_REGEX, { message: 'کد تایید باید ۶ رقمی باشد' })
  code: string;

  @IsString()
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(100)
  fullName: string;

  @Matches(PASSWORD_REGEX, {
    message: 'رمز عبور باید حداقل ۸ کاراکتر و شامل حرف و عدد باشد',
  })
  password: string;
}
