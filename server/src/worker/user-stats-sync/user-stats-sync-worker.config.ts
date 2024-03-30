import { BullModuleOptions } from '@nestjs/bull';
import { MEDIUM_LOAD_JOB_CONFIG_KEY } from '@verdzie/server/bull/wildr-bull.module';
import { WorkflowJobData } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { WorkflowMetadata } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';

export const USER_STATS_SYNC_QUEUE_NAME = 'user-stats-sync-queue-name';
export const USER_STATS_SYNC_JOB_NAME = 'user-stats-sync-job-name';
export const USER_STATS_SYNC_QUEUE_CONFIG: BullModuleOptions = {
  name: USER_STATS_SYNC_QUEUE_NAME,
  configKey: MEDIUM_LOAD_JOB_CONFIG_KEY,
};
export interface UserStatsSyncJobData extends WorkflowJobData {
  userId: string;
  workflowMetadata: WorkflowMetadata;
}
