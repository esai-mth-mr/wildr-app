import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserStrikeReceivedJob } from './strike.producer';
import { StrikeService } from '@verdzie/server/strike/strike.service';

@Processor('strike-queue')
export class StrikeConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userService: UserService,
    private readonly strikeService: StrikeService
  ) {
    console.info('StrikeConsumer created');
    this.logger = this.logger.child({ context: 'StrikeConsumer' });
  }

  /**
   * Archive user's currentScoreData
   * Reset user's currentScoreData
   * Update strike data
   * Suspend the user
   * Send a notification
   */
  @Process('user-strike-received-job')
  async userStrikeReceived(job: Job<UserStrikeReceivedJob>) {
    await this.strikeService.imposeStrike(
      job.data.userId,
      job.data.reportReviewRequestId
    );
  }
}
