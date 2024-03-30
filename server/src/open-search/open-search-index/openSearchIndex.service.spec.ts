import { Test, TestingModule } from '@nestjs/testing';
import { OpenSearchIndexService } from './openSearchIndex.service';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';

describe('OpenSearchIndexService', () => {
  let module: TestingModule;
  let service: OpenSearchIndexService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [WinstonBeanstalkModule.forRoot()],
      providers: [OpenSearchIndexService],
    }).compile();

    service = module.get<OpenSearchIndexService>(OpenSearchIndexService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(async () => await module.close());
});
