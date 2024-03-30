import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseService } from '@verdzie/server/firebase/firebase.service';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import { WinstonBeanstalkModule } from '@verdzie/server/winstonBeanstalk.module';

beforeAll(async () => await SSMParamsService.Instance.updateParams());

describe('FirebaseAuthService', () => {
  let module: TestingModule;
  let service: FirebaseAuthService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [WinstonBeanstalkModule.forRoot()],
      providers: [FirebaseAuthService, FirebaseService],
    }).compile();

    service = module.get<FirebaseAuthService>(FirebaseAuthService);
  });

  afterAll(async () => await module.close());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
