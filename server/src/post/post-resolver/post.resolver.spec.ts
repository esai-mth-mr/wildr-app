import { TestingModule } from '@nestjs/testing';
import { PostResolver } from './post.resolver';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe('PostResolver', () => {
  let module: TestingModule;
  let resolver: PostResolver;

  beforeEach(async () => {
    module = await createMockedTestingModule({
      providers: [PostResolver],
    });

    resolver = module.get<PostResolver>(PostResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
  afterAll(async () => await module.close());
});
