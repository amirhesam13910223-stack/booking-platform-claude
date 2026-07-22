import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// این guard به‌صورت سراسری (APP_GUARD) روی کل اپلیکیشن فعاله —
// یعنی هر endpoint به‌طور پیش‌فرض نیاز به احراز هویت داره، مگر
// این‌که صراحتاً با @Public() علامت‌گذاری بشه. این "secure by
// default" دقیقاً همون چیزیه که در نسخه‌ی قبلی پروژه نبود.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
