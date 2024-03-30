import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export const CHALLENGE_CLEANUP_QUEUE_NAME = 'challenge-cleanup-queue-name';
export const CHALLENGE_CLEANUP_POST_DELETION_JOB_NAME =
  'challenge-cleanup-post-deletion-job-name';
export const CHALLENGE_CLEANUP_CHALLENGE_ENTRIES_FEED_AND_STATS_JOB_NAME =
  'challenge-cleanup-challenge-entries-feed-and-stats-job-name';
export const CHALLENGE_CLEANUP_USER_POST_ENTRIES_FEED_AND_LEADERBOARD_JOB_NAME =
  'challenge-cleanup-user-post-entries-feed-and-leaderboard-job-name';
export const CHALLENGE_CLEANUP_CHALLENGE_PARTICIPANTS_FEED_JOB_NAME =
  'challenge-cleanup-challenge-participants-feed-job-name';

export interface CleanupAfterPostDeletionJobData {
  challengeId: string;
  userId: string;
  postId: string;
}

export interface CleanupChallengeEntriesFeedAndStatsJobData {
  challengeId: string;
  postId: string;
}

export interface CleanupUserPostEntriesFeedAndLeaderboardJobData {
  challengeId: string;
  userId: string;
  postId: string;
}

export interface CleanupChallengeParticipantsFeedJobData {
  challengeId: string;
  userId: string;
}

@Injectable()
export class ChallengeCleanupProducer extends WildrProducer {
  constructor(
    @InjectQueue(CHALLENGE_CLEANUP_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async cleanupAfterPostDeletion(job: CleanupAfterPostDeletionJobData) {
    await this.produce(CHALLENGE_CLEANUP_POST_DELETION_JOB_NAME, job);
  }

  async cleanupChallengeEntriesFeedAndStats(
    job: CleanupChallengeEntriesFeedAndStatsJobData
  ) {
    await this.produce(
      CHALLENGE_CLEANUP_CHALLENGE_ENTRIES_FEED_AND_STATS_JOB_NAME,
      job
    );
  }

  async cleanupUserPostEntriesFeedAndLeaderboard(
    job: CleanupUserPostEntriesFeedAndLeaderboardJobData
  ) {
    await this.produce(
      CHALLENGE_CLEANUP_USER_POST_ENTRIES_FEED_AND_LEADERBOARD_JOB_NAME,
      job
    );
  }

  async cleanupChallengeParticipantsFeed(
    job: CleanupChallengeParticipantsFeedJobData
  ) {
    await this.produce(
      CHALLENGE_CLEANUP_CHALLENGE_PARTICIPANTS_FEED_JOB_NAME,
      job
    );
  }
}
