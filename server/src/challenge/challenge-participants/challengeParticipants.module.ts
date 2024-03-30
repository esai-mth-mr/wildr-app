import { Module } from '@nestjs/common';
import { ChallengeParticipantsService } from '@verdzie/server/challenge/challenge-participants/challengeParticipants.service';
import { ChallengeRepositoryModule } from '@verdzie/server/challenge/challenge-repository/challenge.repository.module';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { UserModule } from '@verdzie/server/user/user.module';
import { PostRepositoryModule } from '@verdzie/server/post/post-repository/postRepository.module';

@Module({
  imports: [
    ChallengeRepositoryModule,
    FeedModule,
    UserModule,
    PostRepositoryModule,
  ],
  exports: [ChallengeParticipantsService],
  providers: [ChallengeParticipantsService],
})
export class ChallengeParticipantsModule {}
