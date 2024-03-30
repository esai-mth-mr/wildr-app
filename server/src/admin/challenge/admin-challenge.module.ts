import { Module } from '@nestjs/common';
import { AdminChallengeController } from './admin-challenge.controller';
import { AdminChallengeService } from './admin-challenge.service';
import { FeedModule } from '@verdzie/server/feed/feed.module';
import { ChallengeRepositoryModule } from '@verdzie/server/challenge/challenge-repository/challenge.repository.module';

@Module({
  imports: [FeedModule, ChallengeRepositoryModule],
  controllers: [AdminChallengeController],
  providers: [AdminChallengeService],
})
export class AdminChallengeModule {}
