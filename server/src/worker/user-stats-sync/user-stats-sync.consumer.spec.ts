import { WorkflowManagerService } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { PostgresQueryFailedException } from '@verdzie/server/typeorm/postgres-exceptions';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { UserStatsSyncConsumer } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.consumer';
import { UserStatsSyncJobData } from './user-stats-sync-worker.config';
import { UserStatsSyncService } from '@verdzie/server/user/user-stats-sync.service';
import { err, ok } from 'neverthrow';

describe(UserStatsSyncConsumer.name, () => {
  describe('processUserStatsFixJob', () => {
    it('should call syncUserStats', async () => {
      const syncUserStats = jest.fn().mockResolvedValue(ok(true));
      const workflowManagerService = {
        handleJobCompletion: jest.fn().mockResolvedValue(ok(true)),
      };
      const module = await createMockedTestingModule({
        providers: [
          UserStatsSyncConsumer,
          {
            provide: WorkflowManagerService,
            useValue: workflowManagerService,
          },
          {
            provide: UserStatsSyncService,
            useValue: {
              syncUserStats,
            },
          },
        ],
      });
      const consumer = module.get(UserStatsSyncConsumer);
      const jobData: UserStatsSyncJobData = {
        userId: 'userId1',
        workflowMetadata: {
          workflowId: WorkflowId.USER_STATS_SYNC,
          workflowInstanceId: 'workflowRunId',
          shardId: 0,
          taskId: 'taskId',
        },
      };
      const job = JobFake({ data: jobData });
      await consumer.processUserStatsSyncJob(job);
      expect(syncUserStats).toHaveBeenCalledWith({
        userId: job.data.userId,
      });
      expect(workflowManagerService.handleJobCompletion).toHaveBeenCalledWith(
        job
      );
    });

    it('should throw error when syncUserStats fails', async () => {
      const syncUserStats = jest
        .fn()
        .mockResolvedValue(
          err(new PostgresQueryFailedException({ error: new Error('error') }))
        );
      const workflowManagerService = {
        handleJobFailure: jest.fn().mockResolvedValue(ok(true)),
      };
      const module = await createMockedTestingModule({
        providers: [
          UserStatsSyncConsumer,
          {
            provide: WorkflowManagerService,
            useValue: workflowManagerService,
          },
          {
            provide: UserStatsSyncService,
            useValue: {
              syncUserStats,
            },
          },
        ],
      });
      const consumer = module.get(UserStatsSyncConsumer);
      const jobData: UserStatsSyncJobData = {
        userId: 'userId1',
        workflowMetadata: {
          workflowId: WorkflowId.USER_STATS_SYNC,
          workflowInstanceId: 'workflowRunId',
          shardId: 0,
          taskId: 'taskId',
        },
      };
      const job = JobFake({ data: jobData });
      await expect(consumer.processUserStatsSyncJob(job)).rejects.toThrow(
        PostgresQueryFailedException
      );
      expect(syncUserStats).toHaveBeenCalledWith({
        userId: job.data.userId,
      });
      expect(workflowManagerService.handleJobFailure).toHaveBeenCalledWith(job);
    });
  });
});
