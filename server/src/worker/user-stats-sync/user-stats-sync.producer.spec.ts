import { getQueueToken } from '@nestjs/bull';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { UserStatsSyncProducer } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.producer';
import { UserStatsSyncJobData } from './user-stats-sync-worker.config';
import { USER_STATS_SYNC_JOB_NAME } from './user-stats-sync-worker.config';
import { USER_STATS_SYNC_QUEUE_NAME } from './user-stats-sync-worker.config';

describe(UserStatsSyncProducer.name, () => {
  describe('createUserStatsSyncJob', () => {
    it('should produce a job', async () => {
      const module = await createMockedTestingModule({
        providers: [
          UserStatsSyncProducer,
          {
            provide: getQueueToken(USER_STATS_SYNC_QUEUE_NAME),
            useValue: {
              add: jest.fn(),
              on: jest.fn(),
            },
          },
        ],
      });
      const producer = module.get(UserStatsSyncProducer);
      const jobData: UserStatsSyncJobData = {
        userId: 'userId1',
        workflowMetadata: {
          workflowId: WorkflowId.USER_STATS_SYNC,
          workflowInstanceId: 'workflowInstanceId',
          shardId: 0,
          taskId: 'taskId',
        },
      };
      const result = await producer.createUserStatsSyncJob(jobData);
      expect(result.isOk()).toBe(true);
    });

    it('should produce a job with correct data', async () => {
      const add = jest.fn();
      const module = await createMockedTestingModule({
        providers: [
          UserStatsSyncProducer,
          {
            provide: getQueueToken(USER_STATS_SYNC_QUEUE_NAME),
            useValue: {
              add,
              on: jest.fn(),
            },
          },
        ],
      });
      const producer = module.get(UserStatsSyncProducer);
      const jobData: UserStatsSyncJobData = {
        userId: 'userId1',
        workflowMetadata: {
          workflowId: WorkflowId.USER_STATS_SYNC,
          workflowInstanceId: 'workflowInstanceId',
          shardId: 0,
          taskId: 'taskId',
        },
      };
      await producer.createUserStatsSyncJob(jobData);
      expect(add).toHaveBeenCalledWith(USER_STATS_SYNC_JOB_NAME, jobData);
    });

    it('should return error when produce fails', async () => {
      const module = await createMockedTestingModule({
        providers: [
          UserStatsSyncProducer,
          {
            provide: getQueueToken(USER_STATS_SYNC_QUEUE_NAME),
            useValue: {
              add: jest.fn().mockRejectedValue(new Error('')),
              on: jest.fn(),
            },
          },
        ],
      });
      const producer = module.get(UserStatsSyncProducer);
      const jobData: UserStatsSyncJobData = {
        userId: 'userId1',
        workflowMetadata: {
          workflowId: WorkflowId.USER_STATS_SYNC,
          workflowInstanceId: 'workflowInstanceId',
          shardId: 0,
          taskId: 'taskId',
        },
      };
      const result = await producer.createUserStatsSyncJob(jobData);
      expect(result.isErr()).toBe(true);
    });
  });
});
