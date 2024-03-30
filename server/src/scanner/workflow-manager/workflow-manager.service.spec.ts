import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import EventEmitter from 'events';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { getQueueToken } from '@nestjs/bull';
import {
  WORKFLOW_MANAGER_TASK_COMPLETION_JOB_NAME,
  WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME,
  WorkflowManagerTaskCompletionProducer,
} from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-completion.producer';
import {
  WORKFLOW_MANAGER_TASK_FAILURE_JOB_NAME,
  WORKFLOW_MANAGER_TASK_FAILURE_QUEUE_NAME,
  WorkflowManagerTaskFailureProducer,
} from '@verdzie/server/worker/workflow-manager/workflow-manager/workflow-manager-failure.producer';
import { TEMPLATE_QUEUE_NAME } from '@verdzie/server/worker/template/template.producer';
import { WorkflowManagerService } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';
import { WorkflowId } from './workflow-manager.types';
import { WorkflowTemplateConfig } from '@verdzie/server/scanner/workflow-manager/configs/workflow-template.config';
import { UserStatsSyncWorkflowConfig } from '@verdzie/server/scanner/workflow-manager/configs/user-stats-sync.workflow-config';

describe(WorkflowManagerService, () => {
  let service: WorkflowManagerService;
  let testQueue: EventEmitter;

  beforeEach(async () => {
    const queue = new EventEmitter();
    const module = await createMockedTestingModule({
      providers: [
        WorkflowManagerService,
        WorkflowManagerTaskCompletionProducer,
        WorkflowManagerTaskFailureProducer,
        WorkflowTemplateConfig,
        UserStatsSyncWorkflowConfig,
        {
          provide: getQueueToken(TEMPLATE_QUEUE_NAME),
          useValue: queue,
        },
        {
          provide: getQueueToken(WORKFLOW_MANAGER_TASK_COMPLETION_QUEUE_NAME),
          useValue: {
            on: jest.fn(),
            add: jest.fn(),
          },
        },
        {
          provide: getQueueToken(WORKFLOW_MANAGER_TASK_FAILURE_QUEUE_NAME),
          useValue: {
            on: jest.fn(),
            add: jest.fn(),
          },
        },
      ],
    });
    service = module.get(WorkflowManagerService);
    testQueue = module.get(getQueueToken(TEMPLATE_QUEUE_NAME));
  });

  describe(WorkflowManagerService.prototype.getWorkflowConfig, () => {
    it('should return the workflow config', () => {
      const config = service.getWorkflowConfig(WorkflowId.TEMPLATE);
      expect(config.isOk()).toBe(true);
    });

    it('should return an error if the workflow config does not exist', () => {
      const config = service.getWorkflowConfig(
        // @ts-expect-error
        'Brian'
      );
      expect(config.isErr()).toBe(true);
    });
  });

  describe(WorkflowManagerService.prototype.handleJobCompletion, () => {
    it('should create task completion jobs', async () => {
      const job = JobFake({
        data: {
          workflowMetadata: {
            workflowId: WorkflowId.TEMPLATE,
            workflowInstanceId: '123',
            shardId: '456',
            taskId: '789',
          },
        },
      });
      service['taskCompletionProducer'].queue.add = jest
        .fn()
        .mockResolvedValueOnce(true);
      await service['handleJobCompletion'](job);
      expect(service['taskCompletionProducer'].queue.add).toBeCalledTimes(1);
      expect(service['taskCompletionProducer'].queue.add).toBeCalledWith(
        WORKFLOW_MANAGER_TASK_COMPLETION_JOB_NAME,
        {
          workflowId: WorkflowId.TEMPLATE,
          workflowInstanceId: '123',
          shardId: '456',
          taskId: '789',
          bullJobId: job.id,
        }
      );
    });

    it('should return an error if the task completion job fails', async () => {
      const job = JobFake({
        data: {
          workflowMetadata: {
            workflowId: WorkflowId.TEMPLATE,
            workflowInstanceId: '123',
            shardId: '456',
            taskId: '789',
          },
        },
      });
      service['taskCompletionProducer'].queue.add = jest
        .fn()
        .mockRejectedValueOnce(new Error('test'));
      const result = await service['handleJobCompletion'](job);
      expect(result.isErr()).toBe(true);
    });
  });

  describe(WorkflowManagerService.prototype.handleJobFailure, () => {
    it('should create task failure jobs', async () => {
      const job = JobFake({
        data: {
          workflowMetadata: {
            workflowId: WorkflowId.TEMPLATE,
            workflowInstanceId: '123',
            shardId: '456',
            taskId: '789',
          },
        },
      });
      service['taskFailureProducer'].queue.add = jest
        .fn()
        .mockResolvedValueOnce(true);
      await service['handleJobFailure'](job);
      expect(service['taskFailureProducer'].queue.add).toBeCalledTimes(1);
      expect(service['taskFailureProducer'].queue.add).toBeCalledWith(
        WORKFLOW_MANAGER_TASK_FAILURE_JOB_NAME,
        {
          workflowId: WorkflowId.TEMPLATE,
          workflowInstanceId: '123',
          shardId: '456',
          taskId: '789',
          bullJobId: job.id,
        }
      );
    });

    it('should return an error if the task failure job fails', async () => {
      const job = JobFake({
        data: {
          workflowMetadata: {
            workflowId: WorkflowId.TEMPLATE,
            workflowInstanceId: '123',
            shardId: '456',
            taskId: '789',
          },
        },
      });
      service['taskFailureProducer'].queue.add = jest
        .fn()
        .mockRejectedValueOnce(new Error('test'));
      const result = await service['handleJobFailure'](job);
      expect(result.isErr()).toBe(true);
    });
  });
});
