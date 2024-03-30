import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import {
  WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME,
  WorkflowManagerTaskCompletionProducer,
} from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-completion.producer';
import {
  WORKFLOW_MANAGER_TASK_FAILURE_QUEUE_NAME,
  WorkflowManagerTaskFailureProducer,
} from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-failure.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME,
    }),
    BullModule.registerQueue({
      name: WORKFLOW_MANAGER_TASK_FAILURE_QUEUE_NAME,
    }),
  ],
  providers: [
    WorkflowManagerTaskCompletionProducer,
    WorkflowManagerTaskFailureProducer,
  ],
  exports: [
    WorkflowManagerTaskCompletionProducer,
    WorkflowManagerTaskFailureProducer,
  ],
})
export class WorkflowManagerProducerModule {}
