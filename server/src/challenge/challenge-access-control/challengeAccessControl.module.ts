import { Module } from '@nestjs/common';
import { ChallengeRepositoryModule } from '@verdzie/server/challenge/challenge-repository/challenge.repository.module';
import { ChallengeAccessControlService } from '@verdzie/server/challenge/challenge-access-control/challengeAccessControl.service';
import { FeedModule } from '@verdzie/server/feed/feed.module';

@Module({
  imports: [ChallengeRepositoryModule, FeedModule],
  exports: [ChallengeAccessControlService],
  providers: [ChallengeAccessControlService],
})
export class ChallengeAccessControlModule {}
