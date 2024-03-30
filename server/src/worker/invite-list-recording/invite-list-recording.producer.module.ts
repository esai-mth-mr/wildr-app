import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  INVITE_LIST_RECORDING_QUEUE_CONFIG,
  InviteListRecordingProducer,
} from '@verdzie/server/worker/invite-list-recording/invite-list-recording.producer';

@Module({
  imports: [BullModule.registerQueue(INVITE_LIST_RECORDING_QUEUE_CONFIG)],
  providers: [InviteListRecordingProducer],
  exports: [InviteListRecordingProducer],
})
export class InviteListRecordingProducerModule {}
