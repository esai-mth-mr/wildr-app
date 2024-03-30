import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { AdminController } from '@verdzie/server/admin/admin.controller';
import { Test } from '@nestjs/testing';

describe('AdminController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminController],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    await app.listen(Number(process.env.ADMIN_HTTP_PORT));
  });

  afterAll(async () => {
    await app.close();
  });

  describe('ping', () => {
    it('should return Pong', async () => {
      const response = await supertest(app.getHttpServer()).get('/ping').send();
      expect(response.status).toBe(200);
      expect(response.text).toBe('Pong');
    });
  });
});
