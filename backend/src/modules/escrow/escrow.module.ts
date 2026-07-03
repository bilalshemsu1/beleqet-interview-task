import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAMES } from '../queues/queues.constants';
import { EscrowService } from './escrow.service';
import { EscrowController } from './escrow.controller';
import { EscrowProcessor } from './escrow.processor';
import { ScheduledProcessor } from './scheduled.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_NAMES.ESCROW },
      { name: QUEUE_NAMES.NOTIFICATIONS },
      { name: QUEUE_NAMES.SCHEDULED },
    ),
  ],
  providers: [EscrowService, EscrowProcessor, ScheduledProcessor],
  controllers: [EscrowController],
  exports: [EscrowService],
})
export class EscrowModule {}
