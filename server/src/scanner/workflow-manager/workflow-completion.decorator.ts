import { copyMetadataFromFunctionToFunction } from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import { WorkflowManagerService } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';
import { WorkflowId } from './workflow-manager.types';
import { getLogger } from '@verdzie/server/winstonBeanstalk.module';
import { Job } from 'bull';

interface WorkflowCompletionConsumer {
  workflowManagerService: WorkflowManagerService;
}

function isWorkflowJob(job: unknown) {
  return (
    typeof job === 'object' &&
    job !== null &&
    typeof (job as any).data?.workflowMetadata?.workflowId === 'number'
  );
}

function jobWorkflowIdMatches(job: Job<any>, workflowId: WorkflowId) {
  return (
    isWorkflowJob(job) &&
    (job as any).data?.workflowMetadata?.workflowId === workflowId
  );
}

export function WorkflowCompletion(workflowId: WorkflowId) {
  return function (
    target: WorkflowCompletionConsumer,
    key: string,
    descriptor: PropertyDescriptor
  ) {
    const originalFunction = descriptor.value;
    const wrappedFunction = async function (...args: any[]) {
      // @ts-ignore
      const workflowManagerService = this
        ?.workflowManagerService as WorkflowManagerService;
      const job = args[0] as Job<any>;
      try {
        // @ts-ignore
        let result = originalFunction.apply(this, args);
        if (result instanceof Promise) result = await result;
        if (isWorkflowJob(job) && jobWorkflowIdMatches(job, workflowId)) {
          const result = await workflowManagerService?.handleJobCompletion(
            args[0]
          );
          if (result.isErr()) {
            getLogger().error(
              'Error handling workflow completion: ' + result.error,
              {
                error: result.error,
              }
            );
            throw result.error;
          }
        }
        return result;
      } catch (error) {
        getLogger().error('Error in workflow completion handler: ' + error, {
          error,
        });
        if (isWorkflowJob(job) && jobWorkflowIdMatches(job, workflowId)) {
          await workflowManagerService?.handleJobFailure(args[0]);
        }
        throw error;
      }
    };
    copyMetadataFromFunctionToFunction(originalFunction, wrappedFunction);
    descriptor.value = wrappedFunction;
    return descriptor;
  };
}
