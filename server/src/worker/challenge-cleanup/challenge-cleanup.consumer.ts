import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import {
  CHALLENGE_CLEANUP_CHALLENGE_ENTRIES_FEED_AND_STATS_JOB_NAME,
  CHALLENGE_CLEANUP_CHALLENGE_PARTICIPANTS_FEED_JOB_NAME,
  CHALLENGE_CLEANUP_POST_DELETION_JOB_NAME,
  CHALLENGE_CLEANUP_QUEUE_NAME,
  CHALLENGE_CLEANUP_USER_POST_ENTRIES_FEED_AND_LEADERBOARD_JOB_NAME,
  CleanupAfterPostDeletionJobData,
  CleanupChallengeEntriesFeedAndStatsJobData,
  CleanupChallengeParticipantsFeedJobData,
  CleanupUserPostEntriesFeedAndLeaderboardJobData,
} from '@verdzie/server/worker/challenge-cleanup/challenge-cleanup.producer';
import { ChallengeCleanupService } from '@verdzie/server/worker/challenge-cleanup/challenge-cleanup.service';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(CHALLENGE_CLEANUP_QUEUE_NAME)
export class ChallengeCleanupConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private challengeCleanupService: ChallengeCleanupService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(CHALLENGE_CLEANUP_POST_DELETION_JOB_NAME)
  async cleanupAfterPostDeletion(job: Job<CleanupAfterPostDeletionJobData>) {
    await this.challengeCleanupService.cleanupAfterPostDeletion(job.data);
  }

  @Process(CHALLENGE_CLEANUP_CHALLENGE_ENTRIES_FEED_AND_STATS_JOB_NAME)
  async cleanupChallengeEntriesFeedAndStats(
    job: Job<CleanupChallengeEntriesFeedAndStatsJobData>
  ) {
    await this.challengeCleanupService.cleanupChallengeEntriesFeedAndStats(
      job.data
    );
  }

  @Process(CHALLENGE_CLEANUP_USER_POST_ENTRIES_FEED_AND_LEADERBOARD_JOB_NAME)
  async cleanupUserPostEntriesFeedAndLeaderboard(
    job: Job<CleanupUserPostEntriesFeedAndLeaderboardJobData>
  ) {
    await this.challengeCleanupService.cleanupUserPostEntriesFeedAndLeaderboard(
      job.data
    );
  }

  @Process(CHALLENGE_CLEANUP_CHALLENGE_PARTICIPANTS_FEED_JOB_NAME)
  async cleanupChallengeParticipantsFeed(
    job: Job<CleanupChallengeParticipantsFeedJobData>
  ) {
    await this.challengeCleanupService.cleanupChallengeParticipantsFeed(
      job.data
    );
  }
}
