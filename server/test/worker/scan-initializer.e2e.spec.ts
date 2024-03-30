import { Test, TestingModule } from '@nestjs/testing';
import { OpenTelemetryMetricsModule } from '@verdzie/server/opentelemetry/openTelemetry.module';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import {
  findJob,
  findJobs,
  getRedisConnection,
} from '@verdzie/test/utils/wildr-redis';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import { ScanInitializerConsumer } from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.consumer';
import { ScanInitializerConsumerModule } from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.consumer.module';
import {
  SCAN_INITIALIZER_QUEUE_NAME,
  ScanInitializerJobData,
  ScanInitializerProducer,
} from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.producer';
import { ScanInitializerProducerModule } from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.producer.module';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import Redis from 'ioredis';
import { Connection, Repository } from 'typeorm';
import {
  WildrBullModule,
  defaultRedis,
} from '@verdzie/server/bull/wildr-bull.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { UserEntityFake } from '@verdzie/server/user/testing/user-entity.fake';
import { ScanInitializerService } from '@verdzie/server/scanner/scan-initializer/scan-initializer.service';
import { JobFake } from '@verdzie/server/worker/testing/job.fake';
import { TASK_INITIALIZER_QUEUE_NAME } from '@verdzie/server/worker/workflow-manager/task-initializer/task-initializer.producer';

describe('ScanInitializer Worker', () => {
  let consumer: ScanInitializerConsumer;
  let producer: ScanInitializerProducer;
  let scanInitializerService: ScanInitializerService;
  let conn: Connection;
  let redis: Redis;
  let module: TestingModule;
  let userRepo: Repository<UserEntity>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        OpenTelemetryMetricsModule,
        WinstonBeanstalkModule.forRoot(),
        WildrTypeormModule,
        WildrBullModule,
        RedisModule.forRoot({
          config: defaultRedis,
        }),
        ScanInitializerProducerModule,
        ScanInitializerConsumerModule,
      ],
    }).compile();
    consumer = module.get<ScanInitializerConsumer>(ScanInitializerConsumer);
    producer = module.get<ScanInitializerProducer>(ScanInitializerProducer);
    scanInitializerService = module.get<ScanInitializerService>(
      ScanInitializerService
    );
    // @ts-expect-error
    scanInitializerService['SCANNER_SLICE_SIZE'] = 100;
    conn = await getTestConnection();
    await conn.synchronize(true);
    redis = await getRedisConnection();
    await redis.flushall();
    userRepo = conn.getRepository(UserEntity);
  });

  beforeEach(async () => {
    await userRepo.delete({});
  });

  afterAll(async () => {
    await conn.close();
    await redis.quit();
    await module.close();
  });

  describe('Producer', () => {
    it('should producer scan initialization jobs', async () => {
      const jobData: ScanInitializerJobData = {
        workflowId: WorkflowId.TEMPLATE,
      };
      await producer.createScanJob(jobData);
      const job = await findJob({
        queue: SCAN_INITIALIZER_QUEUE_NAME,
        number: 1,
      });
      expect(job).toBeDefined();
      expect(job?.data).toMatchObject(jobData);
    });
  });

  describe('Consumer', () => {
    it('should create cursor jobs', async () => {
      const users = Array.from({ length: 130 }, () => UserEntityFake());
      await userRepo.insert(users);
      const orderedUsers = await userRepo.find({
        order: { id: 'ASC' },
      });
      const jobData: ScanInitializerJobData = {
        workflowId: WorkflowId.TEMPLATE,
      };
      await consumer.processScanInitializerJob(JobFake({ data: jobData }));
      const jobs = await findJobs({
        queue: TASK_INITIALIZER_QUEUE_NAME,
      });
      expect(jobs).toHaveLength(2);
      if (jobs?.length) {
        for (const job of jobs) {
          const matches1 =
            job?.data.startId === orderedUsers[0].id &&
            job?.data.endId === orderedUsers[99].id;
          const matches2 = job?.data.startId === orderedUsers[99].id;
          expect(matches1 || matches2).toBeTruthy();
        }
      }
    });
  });
});
