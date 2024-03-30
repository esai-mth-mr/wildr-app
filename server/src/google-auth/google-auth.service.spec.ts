import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import { Test, TestingModule } from '@nestjs/testing';
import { GoogleAuthService } from './google-auth.service';

import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';

beforeAll(async () => await SSMParamsService.Instance.updateParams());

describe('GoogleAuthService', () => {
  let module: TestingModule;
  let service: GoogleAuthService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [WinstonBeanstalkModule.forRoot()],
      providers: [GoogleAuthService],
    }).compile();

    service = module.get<GoogleAuthService>(GoogleAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(async () => await module.close());
});
