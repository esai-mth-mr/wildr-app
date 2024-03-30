import { InjectQueue } from '@nestjs/bull';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '../worker.helper';

@Injectable()
export class UpdateUsersInviteCountProducer {
  constructor(
    @InjectQueue('update-users-invite-count-queue')
    private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({
      context: 'UpdateUsersInviteCountProducer',
    });
  }

  async updateInviteCount(job: UpdateUsersInviteCountJob) {
    await queueWithLogging(
      this.logger,
      this.queue,
      'update-users-invite-count-job',
      job
    );
  }
}

export interface UpdateUsersInviteCountJob {
  handles: string[];
  count?: number;
}
