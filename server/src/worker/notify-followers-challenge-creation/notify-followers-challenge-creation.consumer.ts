import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import {
  NOTIFY_FOLLOWERS_OF_CHALLENGE_CREATION_JOB_NAME,
  NOTIFY_FOLLOWERS_OF_CHALLENGE_CREATION_QUEUE_NAME,
  NOTIFY_FOLLOWER_BATCH_OF_CHALLENGE_CREATION_JOB_NAME,
  NotifyFollowerBatchOfChallengeCreationJobData,
  NotifyFollowersOfChallengeCreationJobData,
} from '@verdzie/server/worker/notify-followers-challenge-creation/notify-followers-challenge-creation.producer';
import { NotifyFollowersOfChallengeCreationService } from '@verdzie/server/worker/notify-followers-challenge-creation/notify-followers-challenge-creation.service';

@Processor(NOTIFY_FOLLOWERS_OF_CHALLENGE_CREATION_QUEUE_NAME)
export class NotifyFollowersOfChallengeCreationConsumer {
  constructor(
    private notifyFollowersOfChallengeCreationService: NotifyFollowersOfChallengeCreationService
  ) {}

  @Process(NOTIFY_FOLLOWERS_OF_CHALLENGE_CREATION_JOB_NAME)
  async notifyAllFollowers(
    job: Job<NotifyFollowersOfChallengeCreationJobData>
  ) {
    await this.notifyFollowersOfChallengeCreationService.notifyAllFollowers(
      job.data
    );
  }

  @Process(NOTIFY_FOLLOWER_BATCH_OF_CHALLENGE_CREATION_JOB_NAME)
  protected async notifyFollowerBatch(
    job: Job<NotifyFollowerBatchOfChallengeCreationJobData>
  ) {
    await this.notifyFollowersOfChallengeCreationService.notifyFollowerBatch(
      job.data
    );
  }
}
