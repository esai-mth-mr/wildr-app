import { Module } from '@nestjs/common';
import { SqsModule } from '@ssut/nestjs-sqs';
import { PostModule } from '../../post/post.module';
import { DeletePostsSQSHandler } from './deletePostsSQS.handler';
import { DeletePostsWorkerModule } from '../../worker/delete-posts/deletePostsWorker.module';

@Module({
  imports: [
    SqsModule.register({
      consumers: [
        {
          name: process.env.SQS_DELETE_POSTS_QUEUE_NAME ?? '',
          queueUrl: process.env.SQS_DELETE_POSTS_QUEUE_URL,
        },
      ],
    }),
    DeletePostsWorkerModule,
    PostModule,
  ],
  providers: [DeletePostsSQSHandler],
  exports: [DeletePostsSQSHandler],
})
export class DeletePostsSQSModule {}
