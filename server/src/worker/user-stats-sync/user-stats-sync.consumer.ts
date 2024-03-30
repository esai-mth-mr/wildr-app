import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WorkflowCompletion } from '@verdzie/server/scanner/workflow-manager/workflow-completion.decorator';
import { WorkflowManagerService } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { UserStatsSyncJobData } from './user-stats-sync-worker.config';
import { USER_STATS_SYNC_JOB_NAME } from './user-stats-sync-worker.config';
import { USER_STATS_SYNC_QUEUE_NAME } from './user-stats-sync-worker.config';
import { UserStatsSyncService } from '@verdzie/server/user/user-stats-sync.service';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(USER_STATS_SYNC_QUEUE_NAME)
export class UserStatsSyncConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userStatsSyncService: UserStatsSyncService,
    readonly workflowManagerService: WorkflowManagerService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @WorkflowCompletion(WorkflowId.USER_STATS_SYNC)
  @Process(USER_STATS_SYNC_JOB_NAME)
  async processUserStatsSyncJob(job: Job<UserStatsSyncJobData>) {
    const result = await this.userStatsSyncService.syncUserStats({
      userId: job.data.userId,
    });
    if (result.isErr()) {
      this.logger.error('Failed to synchronize user stats: ' + result.error, {
        userId: job.data.userId,
        error: result.error,
      });
      throw result.error;
    }
  }
}
