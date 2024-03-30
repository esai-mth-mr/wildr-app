import { TestingModule } from '@nestjs/testing';
import { OpenSearchService } from './openSearch.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe('OpenSearchService', () => {
  let module: TestingModule;
  let service: OpenSearchService;

  beforeAll(async () => {
    module = await createMockedTestingModule({
      providers: [OpenSearchService],
    });

    service = module.get<OpenSearchService>(OpenSearchService);
  });

  afterAll(async () => await module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
