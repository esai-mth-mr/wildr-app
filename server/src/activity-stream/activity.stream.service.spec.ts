import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityStreamEntity } from '@verdzie/server/activity-stream/activity.stream.entity';
import { ActivityStreamService } from './activity.stream.service';

describe('ActivityStreamService', () => {
  let module: TestingModule;
  let service: ActivityStreamService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ActivityStreamService,
        {
          provide: getRepositoryToken(ActivityStreamEntity),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ActivityStreamService>(ActivityStreamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
