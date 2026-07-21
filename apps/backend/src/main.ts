import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

// نقطه‌ی ورود اپلیکیشن. ValidationPipe سراسری تضمین می‌کنه
// هر DTO ورودی اعتبارسنجی بشه — این همون لایه‌ای‌ست که در نسخه‌ی
// قبلی (فرانت‌اند تنها) اصلاً وجود نداشت.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // فیلدهای تعریف‌نشده در DTO رد میشن
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? [],
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
}
bootstrap();
