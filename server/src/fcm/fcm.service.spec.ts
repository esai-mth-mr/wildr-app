import { TestingModule } from '@nestjs/testing';
import { FCMService } from './fcm.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe('FCMService', () => {
  let service: FCMService;

  beforeEach(async () => {
    const module: TestingModule = await createMockedTestingModule({
      providers: [FCMService],
    });

    service = module.get<FCMService>(FCMService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
