import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UserService } from '@verdzie/server/user/user.service';
import { FollowEventFillUpJob } from '@verdzie/server/worker/follow-event-fillup/followEventFillup.producer';

@Processor('follow-event-fill-up-queue')
export class FollowEventFillUpConsumer {
  constructor(private readonly userService: UserService) {}

  @Process('follow-event-fill-up-job')
  async fillUp(job: Job<FollowEventFillUpJob>) {
    await this.userService.followUserFillUp(job.data);
  }
}
