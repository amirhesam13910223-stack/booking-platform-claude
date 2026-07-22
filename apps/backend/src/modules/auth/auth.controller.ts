import { Body, Controller, Get, Post, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequestOtpDto, RequestLoginOtpDto, ForgotPasswordDto } from './dto/request-otp.dto';
import { VerifyRegisterDto } from './dto/verify-register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthenticatedRequestUser } from './interfaces/jwt-payload.interface';

// refresh token در یک httpOnly cookie ذخیره میشه، نه در localStorage —
// این جلوی دسترسی جاوااسکریپت (و در نتیجه XSS) به توکن حساس رو می‌گیره.
const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private deviceContext(req: Request) {
    return {
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip,
    };
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_OPTIONS);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestRegisterOtp(@Body() dto: RequestOtpDto) {
    await this.authService.requestRegisterOtp(dto.phone);
    return { message: 'کد تایید ارسال شد' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register/verify')
  @HttpCode(HttpStatus.CREATED)
  async verifyRegister(
    @Body() dto: VerifyRegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.verifyRegisterAndCreateUser(dto, this.deviceContext(req));
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.loginWithPassword(dto, this.deviceContext(req));
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('login/otp/request')
  @HttpCode(HttpStatus.OK)
  async requestLoginOtp(@Body() dto: RequestLoginOtpDto) {
    await this.authService.requestLoginOtp(dto.phone);
    // پاسخ همیشه یکسانه، صرف‌نظر از این‌که شماره ثبت‌نام شده یا نه
    return { message: 'در صورت معتبر بودن شماره، کد تایید ارسال شد' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login/otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyLoginOtp(
    @Body() dto: VerifyLoginOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.verifyLoginOtp(dto, this.deviceContext(req));
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // پشتیبانی از هر دو حالت: cookie (وب) یا body (موبایل/اپ که کوکی نداره)
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] ?? dto?.refreshToken;
    if (!rawToken) {
      return { message: 'refresh token یافت نشد' };
    }
    const tokens = await this.authService.refreshTokens(rawToken, this.deviceContext(req));
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() dto: RefreshTokenDto | undefined,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] ?? dto?.refreshToken;
    if (rawToken) {
      await this.authService.logout(rawToken);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
    return { message: 'با موفقیت خارج شدید' };
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.phone);
    return { message: 'در صورت معتبر بودن شماره، کد تایید ارسال شد' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'رمز عبور با موفقیت تغییر کرد' };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedRequestUser) {
    return this.authService.getMe(user.id);
  }
}
