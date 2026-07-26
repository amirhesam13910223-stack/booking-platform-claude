import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

// اسکریپت Lua برای release امن: فقط اگه مقدار کلید هنوز همون token
// خودمونه پاکش کن — جلوگیری از این‌که یک holder دیگه (بعد از انقضای
// طبیعی قفل و گرفتنش توسط یک request دیگه) به‌اشتباه توسط ما پاک بشه.
const RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

@Injectable()
export class RedisLockService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * سعی می‌کنه یک قفل روی `key` بگیره. در صورت موفقیت یک token
   * برمی‌گردونه که باید برای release استفاده بشه؛ در صورت شکست
   * (قفل توسط request دیگه‌ای گرفته شده) null برمی‌گردونه.
   */
  async acquire(key: string, ttlMs = 10000): Promise<string | null> {
    const token = randomUUID();
    const result = await this.redis.set(key, token, 'PX', ttlMs, 'NX');
    return result === 'OK' ? token : null;
  }

  async release(key: string, token: string): Promise<void> {
    await this.redis.eval(RELEASE_SCRIPT, 1, key, token);
  }

  /**
   * قفل رو می‌گیره، تابع رو اجرا می‌کنه، و همیشه (حتی در صورت خطا)
   * release می‌کنه. اگه قفل گرفته نشه، خطا پرتاب می‌کنه.
   */
  async withLock<T>(key: string, fn: () => Promise<T>, ttlMs = 10000): Promise<T> {
    const token = await this.acquire(key, ttlMs);
    if (!token) {
      throw new Error(`LOCK_BUSY:${key}`);
    }
    try {
      return await fn();
    } finally {
      await this.release(key, token);
    }
  }
}
