import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  RespawnUserCommentsJob,
  TakeDownUserCommentsJob,
} from '@verdzie/server/worker/existence-state/update-user-comments-state/updateUserCommentsState.producer';
import { Job } from 'bull';
import { CommentService } from '@verdzie/server/comment/comment.service';
import { ExistenceState } from '@verdzie/server/existenceStateEnum';

@Processor('update-user-comments-state-queue')
export class UpdateUserCommentsStateConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly commentService: CommentService
  ) {
    this.logger = this.logger.child({
      context: 'UpdateUserCommentsStateConsumer',
    });
  }

  @Process('take-down-user-comments-job')
  async takeDownUserComments(job: Job<TakeDownUserCommentsJob>) {
    const result = await this.commentService.update(
      {
        authorId: job.data.userId,
      },
      { state: ExistenceState.TAKEN_DOWN }
    );
    this.logger.info('updated states', { result });
  }

  @Process('respawn-user-comments-job')
  async respawnUserComments(job: Job<RespawnUserCommentsJob>) {
    const result = await this.commentService.update(
      {
        authorId: job.data.userId,
      },
      { state: undefined }
    );
    this.logger.info('updated states', { result });
  }
}
