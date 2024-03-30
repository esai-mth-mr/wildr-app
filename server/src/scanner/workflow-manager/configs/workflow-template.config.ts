import { Injectable } from '@nestjs/common';
import { WorkflowConfig } from '../workflow-manager.types';
import { WorkflowMetadata } from '../workflow-manager.types';
import { WorkflowId } from '../workflow-manager.types';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { UserSchema } from '@verdzie/server/user/user.schema';
import { TemplateProducer } from '@verdzie/server/worker/template/template.producer';
import { err, ok } from 'neverthrow';

@Injectable()
export class WorkflowTemplateConfig implements WorkflowConfig {
  workflowId = WorkflowId.TEMPLATE;
  taskSize = 10;
  schema = UserSchema;
  tableName = UserEntity.kTableName;

  constructor(private readonly templateProducer: TemplateProducer) {}

  async produceJob({
    workflowMetadata,
    ids,
  }: {
    workflowMetadata: WorkflowMetadata;
    ids: string[];
  }) {
    const job = await this.templateProducer.createTemplateJob({
      ids,
      workflowMetadata,
    });
    if (job.isErr()) return err(job.error);
    return ok(job.value.id);
  }
}
