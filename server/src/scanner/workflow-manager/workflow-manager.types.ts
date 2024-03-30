import { JobProductionException } from '@verdzie/server/worker/common/wildrProducer';
import Bull from 'bull';
import { Result } from 'neverthrow';
import { EntitySchema } from 'typeorm';

export enum WorkflowId {
  TEMPLATE,
  USER_STATS_SYNC,
}
export interface WorkflowMetadata {
  workflowId: WorkflowId;
  workflowInstanceId: string;
  shardId: number;
  taskId: string;
} // Jobs using the workflow manager must implement this interface

export interface WorkflowJobData {
  workflowMetadata: WorkflowMetadata;
}

export type ProduceJobFn = ({
  workflowMetadata,
  ids,
}: {
  workflowMetadata: {
    workflowId: WorkflowId;
    workflowInstanceId: string;
    shardId: number;
    taskId: string;
  };
  ids: string[];
}) => Promise<Result<Bull.JobId, JobProductionException>>;

export interface WorkflowConfig {
  workflowId: WorkflowId;
  taskSize: number;
  schema: EntitySchema;
  tableName: string;
  produceJob: ProduceJobFn;
}
