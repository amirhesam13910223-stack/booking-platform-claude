import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// روی endpointهایی مثل register/login می‌ذاریم تا از guard سراسری JWT رد بشن.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
