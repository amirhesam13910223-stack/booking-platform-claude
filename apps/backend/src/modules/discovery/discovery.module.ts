import { Module } from '@nestjs/common';
import { DiscoveryController } from './discovery.controller';
import { BusinessModule } from '../business/business.module';

@Module({
  imports: [BusinessModule],
  controllers: [DiscoveryController],
})
export class DiscoveryModule {}
