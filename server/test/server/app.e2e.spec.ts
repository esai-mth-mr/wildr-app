import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@verdzie/server/app.module';
import { client } from '@verdzie/test/test-client';

describe('App', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const appModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = appModule.createNestApplication();
    await app.init();
    await app.listen(process.env.SERVER_HTTP_PORT || 4000);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('health', () => {
    it('should pass health check', async () => {
      const result = await client.get('/health');
      expect(result.data.status).toBe('ok');
    });
  });
});
