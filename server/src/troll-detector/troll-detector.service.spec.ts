import { Test, TestingModule } from '@nestjs/testing';
import { TrollDetectorService } from './troll-detector.service';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';

describe('TrollDetectorService', () => {
  let service: TrollDetectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [WinstonBeanstalkModule.forRoot()],
      providers: [TrollDetectorService],
    }).compile();

    service = module.get<TrollDetectorService>(TrollDetectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
