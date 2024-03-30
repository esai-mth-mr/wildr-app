import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { ReplyService } from '../../reply/reply.service';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { DeleteRepliesJob } from './deleteReplies.producer';

@Processor('delete-replies-queue')
export class DeleteRepliesConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private logger: Logger,
    private replyService: ReplyService
  ) {
    console.info('DeleteRepliesConsumer created');
    this.logger = this.logger.child({ context: 'DeleteRepliesConsumer' });
  }

  @Process('delete-replies-job')
  async deleteReplies(job: Job<DeleteRepliesJob>) {
    this.logger.debug('deleting replies in transaction');
    const result = await this.replyService.deleteInTransaction(job.data.ids);
    if (!result) {
      throw new Error('Failed to delete replies');
    }
    this.logger.debug(`Deleted  ${job.data.ids.length} replies `);
  }
}
