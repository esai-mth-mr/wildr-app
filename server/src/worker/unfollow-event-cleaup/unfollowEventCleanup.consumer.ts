import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UserService } from '@verdzie/server/user/user.service';
import { UnfollowEventCleanupJob } from '@verdzie/server/worker/unfollow-event-cleaup/unfollowEventCleanup.producer';

@Processor('unfollow-event-cleanup-queue')
export class UnfollowEventCleanupConsumer {
  constructor(private readonly userService: UserService) {}

  @Process('unfollow-event-cleanup-job')
  async cleanup(job: Job<UnfollowEventCleanupJob>) {
    await this.userService.unfollowEventCleanup(job.data);
  }
}
