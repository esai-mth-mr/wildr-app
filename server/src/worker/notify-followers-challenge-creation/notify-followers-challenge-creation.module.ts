import { Module } from '@nestjs/common';
import { ActivityModule } from '@verdzie/server/activity/activity.module';
import { ChallengeModule } from '@verdzie/server/challenge/challenge.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { NotifyFollowersOfChallengeCreationProducerModule } from '@verdzie/server/worker/notify-followers-challenge-creation/notify-followers-challenge-creation-producer.module';
import { NotifyFollowersOfChallengeCreationService } from '@verdzie/server/worker/notify-followers-challenge-creation/notify-followers-challenge-creation.service';

@Module({
  imports: [
    FeedModule,
    ChallengeModule,
    UserModule,
    ActivityModule,
    NotifyFollowersOfChallengeCreationProducerModule,
  ],
  providers: [NotifyFollowersOfChallengeCreationService],
  exports: [NotifyFollowersOfChallengeCreationService],
})
export class NotifyFollowersChallengeCreationModule {}
