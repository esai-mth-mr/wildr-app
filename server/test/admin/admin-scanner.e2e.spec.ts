import { INestApplication } from '@nestjs/common';
import { AdminScannerModule } from '@verdzie/server/admin/scanner/scanner.module';
import { WildrBullModule } from '@verdzie/server/bull/wildr-bull.module';
import { getTestConnection } from '@verdzie/test/utils/wildr-db';
import { WildrTypeormModule } from '@verdzie/server/typeorm/wildr-typeorm.module';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';
import { Connection } from 'typeorm';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import Redis from 'ioredis';
import { findJob, getRedisConnection } from '@verdzie/test/utils/wildr-redis';
import { WorkflowId } from '@verdzie/server/scanner/workflow-manager/workflow-manager.types';
import supertest from 'supertest';
import { SCAN_INITIALIZER_QUEUE_NAME } from '@verdzie/server/worker/workflow-manager/scan-initializer/scan-initializer.producer';

describe('AdminScannerController', () => {
  let app: INestApplication;
  let conn: Connection;
  let redis: Redis;

  beforeAll(async () => {
    const module = await createMockedTestingModule({
      imports: [
        WinstonBeanstalkModule.forRoot(),
        WildrBullModule,
        WildrTypeormModule,
        AdminScannerModule,
      ],
    });
    app = module.createNestApplication();
    conn = await getTestConnection();
    redis = await getRedisConnection();
    await conn.synchronize(true);
    await app.init();
    await app.listen(Number(process.env.ADMIN_HTTP_PORT));
  });

  beforeEach(async () => {
    await redis.flushall();
  });

  afterAll(async () => {
    await app.close();
    await redis.flushall();
    await redis.quit();
    await conn.close();
  });

  describe('requestScan', () => {
    it('should request a scan', async () => {
      const response = await supertest(app.getHttpServer())
        .post('/scanner/request-scan')
        .send({
          workflowId: WorkflowId.TEMPLATE,
        })
        .expect(201);
      expect(response.body).toEqual({});
      const job = await findJob({
        queue: SCAN_INITIALIZER_QUEUE_NAME,
      });
      expect(job?.data).toEqual({ workflowId: WorkflowId.TEMPLATE });
    });
  });
});
