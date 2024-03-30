import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { IsEnum } from 'class-validator';

export class RequestScanDto {
  @IsEnum(WorkflowId)
  workflowId: WorkflowId;
}
