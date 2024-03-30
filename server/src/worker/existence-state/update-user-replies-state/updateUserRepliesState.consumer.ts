import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Job } from 'bull';
import { TakeDownUserRepliesJob } from '@verdzie/server/worker/existence-state/update-user-replies-state/updateUserRepliesState.producer';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';
import { ReplyService } from '@verdzie/server/reply/reply.service';

@Processor('update-user-replies-state-queue')
export class UpdateUserRepliesStateConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly replyService: ReplyService
  ) {
    this.logger = this.logger.child({
      context: 'UpdateUserRepliesStateConsumer',
    });
  }

  @Process('take-down-user-replies-job')
  async takeDownUserReplies(job: Job<TakeDownUserRepliesJob>) {
    const result = await this.replyService.update(
      {
        authorId: job.data.userId,
      },
      { state: ExistenceState.TAKEN_DOWN }
    );
    this.logger.info('updated states', { result });
  }
}
