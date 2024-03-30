import { Injectable } from '@nestjs/common';
import { WorkflowConfig } from '../workflow-manager.types';
import { WorkflowMetadata } from '../workflow-manager.types';
import { WorkflowId } from '../workflow-manager.types';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserSchema } from '@verdzie/server/user/user.schema';
import { UserStatsSyncProducer } from '@verdzie/server/worker/user-stats-sync/user-stats-sync.producer';
import { err, ok } from 'neverthrow';

@Injectable()
export class UserStatsSyncWorkflowConfig implements WorkflowConfig {
  workflowId = WorkflowId.USER_STATS_SYNC;
  taskSize = 1;
  schema = UserSchema;
  tableName = UserEntity.kTableName;

  constructor(private readonly userStatsSyncProducer: UserStatsSyncProducer) {}

  async produceJob({
    workflowMetadata,
    ids,
  }: {
    workflowMetadata: WorkflowMetadata;
    ids: string[];
  }) {
    const job = await this.userStatsSyncProducer.createUserStatsSyncJob({
      userId: ids[0],
      workflowMetadata,
    });
    if (job.isErr()) return err(job.error);
    return ok(job.value.id);
  }
}
