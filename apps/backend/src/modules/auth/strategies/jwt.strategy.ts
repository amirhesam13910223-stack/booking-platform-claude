import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { JwtPayload, AuthenticatedRequestUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  // این متد بعد از تایید امضا/انقضای توکن صدا زده میشه؛ این‌جا اضافه
  // چک می‌کنیم که کاربر هنوز واقعاً فعاله (مثلاً بعد از suspend شدن
  // یک access token قدیمی نباید همچنان کار کنه تا انقضای ۱۵ دقیقه‌ایش).
  async validate(payload: JwtPayload): Promise<AuthenticatedRequestUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('حساب کاربری معتبر نیست');
    }
    return { id: user.id, role: user.globalRole };
  }
}
