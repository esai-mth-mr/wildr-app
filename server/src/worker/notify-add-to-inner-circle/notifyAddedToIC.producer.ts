import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { queueWithLogging } from '@verdzie/server/worker/worker.helper';

@Injectable()
export class NotifyAddedToICProducer {
  private readonly canNotify: boolean;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectQueue('notify-added-to-ic-queue')
    private queue: Queue
  ) {
    this.logger = this.logger.child({
      context: NotifyAddedToICProducer.name,
    });

    this.canNotify = process.env.CAN_IC_NOTIFY === 'true';
  }

  async userAddedToIC(job: UserAddedToInnerCircleJob) {
    this.logger.info('mentionUserAddedToIC()', {});
    if (!this.canNotify) {
      this.logger.info('Can not notify', {});
      return;
    }
    await queueWithLogging(
      this.logger,
      this.queue,
      'notify-added-to-ic-job',
      job,
      { job }
    );
  }

  async userAutoAddedToIC(job: UserAddedToInnerCircleJob) {
    this.logger.info('userAutoAdded()', {});
    if (!this.canNotify) {
      this.logger.info('Can not notify', {});
      return;
    }
    await queueWithLogging(
      this.logger,
      this.queue,
      'notify-auto-added-to-ic-job',
      job,
      { job }
    );
  }
}

export interface UserAddedToInnerCircleJob {
  addedUserId: string;
  ownerId: string;
  shouldSendNotificationToAddedUser?: boolean;
}
