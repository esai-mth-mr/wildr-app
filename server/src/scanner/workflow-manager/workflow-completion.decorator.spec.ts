import { WorkflowCompletion } from '@verdzie/server/scanner/workflow-manager/workflow-completion.decorator';
import {
  WorkflowId,
  WorkflowJobData,
} from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { err, ok } from 'neverthrow';

describe('WorkflowCompletion', () => {
  it('should call handleJobCompletion if the workflowId matches', async () => {
    const workflowManagerService = {
      handleJobCompletion: jest.fn().mockResolvedValue(ok('ok')),
    };
    const jobData: WorkflowJobData = {
      workflowMetadata: {
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: 'test',
        shardId: 0,
        taskId: 'test',
      },
    };
    const job = JobFake({ data: jobData });
    const context = {
      workflowManagerService,
    };
    const wrappedFunction = WorkflowCompletion(WorkflowId.TEMPLATE)(
      { workflowManagerService } as any,
      'key',
      { value: jest.fn().mockImplementation(() => ok('ok')) }
    ).value;
    await wrappedFunction.call(context, job);
    expect(workflowManagerService.handleJobCompletion).toBeCalledTimes(1);
    expect(workflowManagerService.handleJobCompletion).toBeCalledWith(job);
  });

  it('should call handleJobCompletion in async fn if the workflowId matches', async () => {
    const workflowManagerService = {
      handleJobCompletion: jest.fn().mockResolvedValue(ok('ok')),
    };
    const jobData: WorkflowJobData = {
      workflowMetadata: {
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: 'test',
        shardId: 0,
        taskId: 'test',
      },
    };
    const job = JobFake({ data: jobData });
    const context = {
      workflowManagerService,
    };
    const wrappedFunction = WorkflowCompletion(WorkflowId.TEMPLATE)(
      { workflowManagerService } as any,
      'key',
      {
        value: jest.fn().mockImplementation(async () => {
          return ok('ok');
        }),
      }
    ).value;
    await wrappedFunction.call(context, job);
    expect(workflowManagerService.handleJobCompletion).toBeCalledTimes(1);
    expect(workflowManagerService.handleJobCompletion).toBeCalledWith(job);
  });

  it('should not call handleJobCompletion if the workflowId does not match', async () => {
    const workflowManagerService = {
      handleJobCompletion: jest.fn().mockResolvedValue(ok('ok')),
    };
    const jobData: WorkflowJobData = {
      workflowMetadata: {
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: 'test',
        shardId: 0,
        taskId: 'test',
      },
    };
    const job = JobFake({ data: jobData });
    const context = {
      workflowManagerService,
    };
    // @ts-expect-error
    const wrappedFunction = WorkflowCompletion('brian')(
      { workflowManagerService } as any,
      'key',
      { value: jest.fn().mockImplementation(() => ok('ok')) }
    ).value;
    await wrappedFunction.call(context, job);
    expect(workflowManagerService.handleJobCompletion).toBeCalledTimes(0);
  });

  it('should call handleJobFailure if the workflowId matches', async () => {
    const workflowManagerService = {
      handleJobFailure: jest.fn().mockResolvedValue(ok('ok')),
    };
    const jobData: WorkflowJobData = {
      workflowMetadata: {
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: 'test',
        shardId: 0,
        taskId: 'test',
      },
    };
    const job = JobFake({
      data: jobData,
    });
    const context = { workflowManagerService };
    const wrappedFunction = WorkflowCompletion(WorkflowId.TEMPLATE)(
      { workflowManagerService } as any,
      'key',
      {
        value: jest.fn().mockImplementation(() => {
          throw new Error('test');
        }),
      }
    ).value;
    await wrappedFunction.call(context, job).catch(() => ({}));
    expect(workflowManagerService.handleJobFailure).toBeCalledTimes(1);
  });

  it('should not call handleJobFailure if the workflowId does not match', async () => {
    const workflowManagerService = {
      handleJobFailure: jest.fn().mockResolvedValue(ok('ok')),
    };
    const jobData: WorkflowJobData = {
      workflowMetadata: {
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: 'test',
        shardId: 0,
        taskId: 'test',
      },
    };
    const job = JobFake({
      data: jobData,
    });
    const context = { workflowManagerService };
    // @ts-expect-error
    const wrappedFunction = WorkflowCompletion('brian')(
      { workflowManagerService } as any,
      'key',
      {
        value: jest.fn().mockImplementation(() => {
          throw new Error('test');
        }),
      }
    ).value;
    await wrappedFunction.call(context, job).catch(() => ({}));
    expect(workflowManagerService.handleJobFailure).toBeCalledTimes(0);
  });

  it('should call handleJobFailure in async fn the workflowId matches', async () => {
    const workflowManagerService = {
      handleJobFailure: jest.fn().mockResolvedValue(ok('ok')),
    };
    const jobData: WorkflowJobData = {
      workflowMetadata: {
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: 'test',
        shardId: 0,
        taskId: 'test',
      },
    };
    const job = JobFake({ data: jobData });
    const context = { workflowManagerService };
    const wrappedFunction = WorkflowCompletion(WorkflowId.TEMPLATE)(
      { workflowManagerService } as any,
      'key',
      {
        value: jest.fn().mockImplementation(async () => {
          throw new Error('test');
        }),
      }
    ).value;
    await wrappedFunction.call(context, job).catch(() => ({}));
    expect(workflowManagerService.handleJobFailure).toBeCalledTimes(1);
  });

  it('should throw if error if handlingCompletion returns error', async () => {
    const workflowManagerService = {
      handleJobCompletion: jest.fn().mockResolvedValue(err('bad')),
      handleJobFailure: jest.fn().mockResolvedValue(ok('ok')),
    };
    const jobData: WorkflowJobData = {
      workflowMetadata: {
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: 'test',
        shardId: 0,
        taskId: 'test',
      },
    };
    const job = JobFake({
      data: jobData,
    });
    const context = {
      workflowManagerService,
    };
    const wrappedFunction = WorkflowCompletion(WorkflowId.TEMPLATE)(
      { workflowManagerService } as any,
      'key',
      {
        value: jest.fn().mockImplementation(() => ok('ok')),
      }
    ).value;
    await expect(wrappedFunction.call(context, job)).rejects.toBe('bad');
    expect(workflowManagerService.handleJobFailure).toBeCalledTimes(1);
  });
});
