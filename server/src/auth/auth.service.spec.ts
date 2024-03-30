import { TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe('AuthService', () => {
  let module: TestingModule;
  let service: AuthService;

  beforeAll(async () => {
    module = await createMockedTestingModule({
      providers: [AuthService],
    });

    service = module.get<AuthService>(AuthService);
  });

  afterAll(async () => await module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
