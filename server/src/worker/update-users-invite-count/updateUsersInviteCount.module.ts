import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { UpdateUsersInviteCountProducer } from './updateUsersInviteCount.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'update-users-invite-count-queue',
    }),
  ],
  providers: [UpdateUsersInviteCountProducer],
  exports: [UpdateUsersInviteCountProducer],
})
export class UpdateUsersInviteCountWorkerModule {}
