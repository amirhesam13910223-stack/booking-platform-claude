import { Global, Module } from '@nestjs/common';
import { SMS_PROVIDER } from './sms.interface';
import { ConsoleSmsProvider } from './console-sms.provider';

@Global()
@Module({
  providers: [{ provide: SMS_PROVIDER, useClass: ConsoleSmsProvider }],
  exports: [SMS_PROVIDER],
})
export class SmsModule {}
