import { ScanInitializerService } from '@verdzie/server/scanner/scan-initializer/scan-initializer.service';
import { WorkflowConfigNotFoundException } from '@verdzie/server/scanner/workflow-manager/workflow-manager.service';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { err, ok } from 'neverthrow';
import { WorkflowStateService } from '@verdzie/server/scanner/workflow-state/workflow-state.service';

describe(ScanInitializerService, () => {
  let service: ScanInitializerService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        ScanInitializerService,
        {
          provide: WorkflowStateService,
          useValue: {
            createWorkflowInstanceState: jest.fn().mockResolvedValue(ok(true)),
            setWorkflowStatusInProgress: jest.fn().mockResolvedValue(ok(true)),
          },
        },
      ],
    });
    service = module.get(ScanInitializerService);
  });

  describe(ScanInitializerService.prototype.initializeWorkflow, () => {
    it('should return an error if the scanner job config does not exist', async () => {
      service['workflowManagerService'].getWorkflowConfig = jest
        .fn()
        .mockReturnValueOnce(
          err(new WorkflowConfigNotFoundException(WorkflowId.TEMPLATE))
        );
      const result = await service.initializeWorkflow({
        workflowId: WorkflowId.TEMPLATE,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        WorkflowConfigNotFoundException
      );
    });

    it('should return an error if the scanner cursor query fails', async () => {
      service['workflowManagerService'].getWorkflowConfig = jest
        .fn()
        .mockReturnValueOnce(
          ok({
            workflowId: WorkflowId.TEMPLATE,
            jobSize: 100,
            schema: {},
            tableName: 'post',
            produceJob: jest.fn(),
          })
        );
      service['connection'].query = jest
        .fn()
        .mockRejectedValueOnce(new Error('query failed'));
      const result = await service.initializeWorkflow({
        workflowId: WorkflowId.TEMPLATE,
      });
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(Error);
    });

    it('should produce jobs for each slice', async () => {
      service['workflowManagerService'].getWorkflowConfig = jest
        .fn()
        .mockReturnValueOnce(
          ok({
            workflowId: WorkflowId.TEMPLATE,
            jobSize: 100,
            schema: {},
            tableName: 'post',
            produceJob: jest.fn(),
          })
        );
      service['connection'].query = jest
        .fn()
        .mockResolvedValueOnce([{ id: '1' }, { id: '100' }, { id: '200' }]);
      service['taskInitializerProducer'].createTaskInitializerJobs = jest
        .fn()
        .mockResolvedValueOnce(ok(true));
      service['workflowStateService'].createWorkflowInstanceState = jest
        .fn()
        .mockResolvedValueOnce(ok(true));
      const result = await service.initializeWorkflow({
        workflowId: WorkflowId.TEMPLATE,
      });
      expect(result._unsafeUnwrap()).toEqual({
        workflowInstanceId: expect.any(String),
        shardCount: 3,
      });
      expect(
        service['taskInitializerProducer'].createTaskInitializerJobs
      ).toHaveBeenCalledWith([
        {
          workflowId: WorkflowId.TEMPLATE,
          workflowInstanceId: expect.any(String),
          shard: 0,
          startId: '1',
          endId: '100',
        },
        {
          workflowId: WorkflowId.TEMPLATE,
          workflowInstanceId: expect.any(String),
          shard: 1,
          startId: '100',
          endId: '200',
        },
        {
          workflowId: WorkflowId.TEMPLATE,
          workflowInstanceId: expect.any(String),
          shard: 2,
          startId: '200',
          endId: undefined,
        },
      ]);
    });

    it('should initialize the workflow state', async () => {
      service['workflowManagerService'].getWorkflowConfig = jest
        .fn()
        .mockReturnValueOnce(
          ok({
            workflowId: WorkflowId.TEMPLATE,
            jobSize: 100,
            schema: {},
            tableName: 'post',
            produceJob: jest.fn(),
          })
        );
      service['connection'].query = jest
        .fn()
        .mockResolvedValueOnce([{ id: '1' }, { id: '100' }, { id: '200' }]);
      service['taskInitializerProducer'].createTaskInitializerJobs = jest
        .fn()
        .mockResolvedValueOnce(ok(true));
      service['workflowStateService'].createWorkflowInstanceState = jest
        .fn()
        .mockResolvedValueOnce(ok(true));
      const result = await service.initializeWorkflow({
        workflowId: WorkflowId.TEMPLATE,
      });
      expect(result._unsafeUnwrap()).toEqual({
        workflowInstanceId: expect.any(String),
        shardCount: 3,
      });
      expect(
        service['workflowStateService'].createWorkflowInstanceState
      ).toHaveBeenCalledWith({
        workflowId: WorkflowId.TEMPLATE,
        workflowInstanceId: expect.any(String),
        shardCount: 3,
      });
    });

    it('should retry if setting workflow status to IN_PROGRESS fails', async () => {
      service['workflowManagerService'].getWorkflowConfig = jest
        .fn()
        .mockReturnValueOnce(
          ok({
            workflowId: WorkflowId.TEMPLATE,
            jobSize: 100,
            schema: {},
            tableName: 'post',
            produceJob: jest.fn(),
          })
        );
      service['connection'].query = jest
        .fn()
        .mockResolvedValueOnce([{ id: '1' }, { id: '100' }, { id: '200' }]);
      service['taskInitializerProducer'].createTaskInitializerJobs = jest
        .fn()
        .mockResolvedValueOnce(ok(true));
      service['workflowStateService'].createWorkflowInstanceState = jest
        .fn()
        .mockResolvedValueOnce(ok(true));
      service['workflowStateService'].setWorkflowStatusInProgress = jest
        .fn()
        .mockResolvedValue(err(new Error('test')));
      // @ts-expect-error
      service['WORKFLOW_STATUS_RETRY_COUNT'] = 1;
      await service.initializeWorkflow({
        workflowId: WorkflowId.TEMPLATE,
      });
      expect(
        service['workflowStateService'].setWorkflowStatusInProgress
      ).toHaveBeenCalledTimes(2);
    });
  });
});
