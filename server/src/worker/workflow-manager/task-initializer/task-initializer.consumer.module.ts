import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TaskInitializerServiceModule } from '@verdzie/server/scanner/task-initializer/task-initializer.service.module';
import { TaskInitializerConsumer } from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.consumer';
import {
  TASK_INITIALIZER_QUEUE_NAME,
  TaskInitializerProducer,
} from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: TASK_INITIALIZER_QUEUE_NAME,
    }),
    TaskInitializerServiceModule,
  ],
  providers: [TaskInitializerProducer, TaskInitializerConsumer],
  exports: [TaskInitializerConsumer],
})
export class TaskInitializerConsumerModule {}
