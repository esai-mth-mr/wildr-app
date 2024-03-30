import {
  DebugData,
  InternalServerErrorException,
  InternalServerErrorExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';
import { WorkflowStatus } from '@verdzie/server/scanner/workflow-state/workflow-state.service';

export class BadWorkflowStatusTransitionException extends InternalServerErrorException {
  constructor({
    currentState,
    newState,
    debugData,
  }: {
    currentState: WorkflowStatus;
    newState: WorkflowStatus;
    debugData: DebugData<InternalServerErrorExceptionCodes>;
  }) {
    super('Bad workflow state transition', {
      ...debugData,
      currentState,
      newState,
      exceptionCode:
        InternalServerErrorExceptionCodes.BAD_WORKFLOW_STATUS_TRANSITION,
    });
  }
}

export class BadWorkflowShardStatusTransitionException extends InternalServerErrorException {
  constructor({
    currentState,
    newState,
    debugData,
  }: {
    currentState: WorkflowStatus;
    newState: WorkflowStatus;
    debugData: DebugData<InternalServerErrorExceptionCodes>;
  }) {
    super('Bad workflow shard state transition', {
      ...debugData,
      currentState,
      newState,
      exceptionCode:
        InternalServerErrorExceptionCodes.BAD_WORKFLOW_STATUS_TRANSITION,
    });
  }
}
