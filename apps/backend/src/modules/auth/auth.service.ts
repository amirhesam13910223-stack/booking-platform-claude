import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { hashPassword, verifyPassword, sha256Hash } from '../../common/crypto/hash.util';
import { VerifyRegisterDto } from './dto/verify-register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyLoginOtpDto } from './dto/verify-login-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface DeviceContext {
  deviceInfo?: string;
  ipAddress?: string;
}

const REFRESH_TOKEN_BYTES = 48;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ---------------------------------------------------------
  // ثبت‌نام
  // ---------------------------------------------------------

  async requestRegisterOtp(phone: string): Promise<{ debugCode?: string }> {
    const existing = await this.prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictException('این شماره قبلاً ثبت‌نام کرده است');
    }
    return this.otp.requestOtp(phone, 'REGISTER');
  }

  async verifyRegisterAndCreateUser(
    dto: VerifyRegisterDto,
    ctx: DeviceContext,
  ): Promise<TokenPair> {
    const isValid = await this.otp.verifyOtp(dto.phone, 'REGISTER', dto.code);
    if (!isValid) {
      throw new BadRequestException('کد تایید نادرست است');
    }

    // چک ثانویه‌ی race condition: بین درخواست OTP و verify ممکنه
    // یک درخواست دیگه هم‌زمان همون شماره رو ثبت‌نام کرده باشه.
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new ConflictException('این شماره قبلاً ثبت‌نام کرده است');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        fullName: dto.fullName,
        passwordHash,
        phoneVerified: true,
      },
    });

    // کیف پول و حساب وفاداری به‌صورت خودکار برای هر کاربر جدید ساخته میشه
    // چون در فازهای بعدی (پرداخت/وفاداری) بدون این‌ها کار نمی‌کنه.
    await this.prisma.wallet.create({ data: { userId: user.id } });
    await this.prisma.loyaltyAccount.create({ data: { userId: user.id } });

    return this.issueTokenPair(user.id, user.globalRole, ctx);
  }

  // ---------------------------------------------------------
  // ورود
  // ---------------------------------------------------------

  async loginWithPassword(dto: LoginDto, ctx: DeviceContext): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    // پیام خطا عمداً یکسانه برای «کاربر نیست» و «رمز غلطه» —
    // جلوگیری از user enumeration.
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('شماره یا رمز عبور نادرست است');
    }

    const isValid = await verifyPassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('شماره یا رمز عبور نادرست است');
    }

    return this.issueTokenPair(user.id, user.globalRole, ctx);
  }

  async requestLoginOtp(phone: string): Promise<{ debugCode?: string }> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user || user.status !== 'ACTIVE') {
      // پیام رو یکسان نگه می‌داریم که مشخص نشه شماره ثبت‌نام شده یا نه
      return {};
    }
    return this.otp.requestOtp(phone, 'LOGIN', user.id);
  }

  async verifyLoginOtp(dto: VerifyLoginOtpDto, ctx: DeviceContext): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('ورود ناموفق بود');
    }

    const isValid = await this.otp.verifyOtp(dto.phone, 'LOGIN', dto.code);
    if (!isValid) {
      throw new BadRequestException('کد تایید نادرست است');
    }

    return this.issueTokenPair(user.id, user.globalRole, ctx);
  }

  // ---------------------------------------------------------
  // بازیابی رمز عبور
  // ---------------------------------------------------------

  async forgotPassword(phone: string): Promise<{ debugCode?: string }> {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return {}; // همون منطق ضد enumeration
    }
    return this.otp.requestOtp(phone, 'RESET_PASSWORD', user.id);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      throw new BadRequestException('درخواست نامعتبر است');
    }

    const isValid = await this.otp.verifyOtp(dto.phone, 'RESET_PASSWORD', dto.code);
    if (!isValid) {
      throw new BadRequestException('کد تایید نادرست است');
    }

    const passwordHash = await hashPassword(dto.newPassword);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    // بعد از تغییر رمز، تمام نشست‌های فعال باطل میشن — یک اقدام
    // امنیتی استاندارد (مثلاً اگر رمز به‌خاطر لو رفتن عوض شده).
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ---------------------------------------------------------
  // مدیریت توکن
  // ---------------------------------------------------------

  private async issueTokenPair(
    userId: string,
    role: 'USER' | 'ADMIN',
    ctx: DeviceContext,
  ): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );

    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const refreshDays = this.parseDays(this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'));
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: sha256Hash(refreshToken),
        deviceInfo: ctx.deviceInfo,
        ipAddress: ctx.ipAddress,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(rawRefreshToken: string, ctx: DeviceContext): Promise<TokenPair> {
    const tokenHash = sha256Hash(rawRefreshToken);
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('نشست منقضی شده، دوباره وارد شوید');
    }

    const user = await this.prisma.user.findUnique({ where: { id: record.userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('حساب کاربری معتبر نیست');
    }

    // چرخش توکن (rotation): توکن قدیمی همیشه باطل میشه، حتی اگر
    // ری‌پلی بشه — این جلوی استفاده‌ی مجدد یک refresh token دزدیده‌شده رو می‌گیره.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(user.id, user.globalRole, ctx);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = sha256Hash(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        globalRole: true,
        phoneVerified: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('کاربر یافت نشد');
    }
    return user;
  }

  private parseDays(value: string): number {
    const match = /^(\d+)d$/.exec(value);
    return match ? parseInt(match[1], 10) : 30;
  }
}
