import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  TASK_INITIALIZER_QUEUE_NAME,
  TaskInitializerProducer,
} from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: TASK_INITIALIZER_QUEUE_NAME,
    }),
  ],
  providers: [TaskInitializerProducer],
  exports: [TaskInitializerProducer],
})
export class TaskInitializerProducerModule {}
