import { Module } from '@nestjs/common';
import { InviteListServiceModule } from '@verdzie/server/invite-lists/invite-list.service.module';
import { InviteListRecordingConsumer } from '@verdzie/server/worker/invite-list-recording/invite-list-recording.consumer';
import { InviteListRecordingProducerModule } from '@verdzie/server/worker/invite-list-recording/invite-list-recording.producer.module';

@Module({
  imports: [InviteListServiceModule, InviteListRecordingProducerModule],
  providers: [InviteListRecordingConsumer],
  exports: [InviteListRecordingConsumer],
})
export class InviteListRecordingConsumerModule {}
