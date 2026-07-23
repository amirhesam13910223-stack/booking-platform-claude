import { Module } from '@nestjs/common';
import { AdminBusinessController } from './admin-business.controller';
import { BusinessModule } from '../../business/business.module';

@Module({
  imports: [BusinessModule],
  controllers: [AdminBusinessController],
})
export class AdminBusinessModule {}
