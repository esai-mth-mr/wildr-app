import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { WorkflowManagerTaskCompletionConsumer } from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-completion.consumer';
import {
  WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME,
  WorkflowManagerTaskCompletionProducer,
} from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-completion.producer';
import { WorkflowManagerTaskFailureConsumer } from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-failure.consumer';
import {
  WORKFLOW_MANAGER_TASK_FAILURE_QUEUE_NAME,
  WorkflowManagerTaskFailureProducer,
} from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-failure.producer';
import { WorkflowManagerServiceModule } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME,
    }),
    BullModule.registerQueue({
      name: WORKFLOW_MANAGER_TASK_FAILURE_QUEUE_NAME,
    }),
    WorkflowManagerServiceModule,
  ],
  providers: [
    WorkflowManagerTaskCompletionProducer,
    WorkflowManagerTaskCompletionConsumer,
    WorkflowManagerTaskFailureProducer,
    WorkflowManagerTaskFailureConsumer,
  ],
  exports: [
    WorkflowManagerTaskCompletionConsumer,
    WorkflowManagerTaskFailureConsumer,
  ],
})
export class WorkflowManagerConsumerModule {}
