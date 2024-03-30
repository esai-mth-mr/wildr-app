import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { CommentModule } from '../../comment/comment.module';
import { DeleteCommentsSQSHandler } from './deleteCommentsSQS.handler';
import { DeleteCommentsWorkerModule } from '../../worker/delete-comments/deleteCommentsWorker.module';

@Module({
  imports: [
    SqsModule.register({
      consumers: [
        {
          name: process.env.SQS_DELETE_COMMENTS_QUEUE_NAME ?? '',
          queueUrl: process.env.SQS_DELETE_COMMENTS_QUEUE_URL,
        },
      ],
    }),
    DeleteCommentsWorkerModule,
    CommentModule,
  ],
  providers: [DeleteCommentsSQSHandler],
  exports: [DeleteCommentsSQSHandler],
})
export class DeleteCommentsSQSModule {}
