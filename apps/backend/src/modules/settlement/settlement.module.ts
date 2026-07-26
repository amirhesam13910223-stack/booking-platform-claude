import { Module } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { BusinessSettlementController, AdminSettlementController } from './settlement.controller';

@Module({
  controllers: [BusinessSettlementController, AdminSettlementController],
  providers: [SettlementService],
  exports: [SettlementService],
})
export class SettlementModule {}
