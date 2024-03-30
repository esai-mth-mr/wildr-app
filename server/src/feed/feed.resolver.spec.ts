import { TestingModule } from '@nestjs/testing';
import { FeedResolver } from './feed.resolver';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe('FeedResolver', () => {
  let module: TestingModule;
  let resolver: FeedResolver;

  beforeAll(async () => {
    module = await createMockedTestingModule({
      providers: [FeedResolver],
    });

    resolver = module.get<FeedResolver>(FeedResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  afterAll(async () => await module.close());
});
