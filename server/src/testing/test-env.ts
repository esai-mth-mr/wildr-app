// eslint-disable-next-line
import * as dotenv from 'dotenv';
dotenv.config({ path: 'env/test.env' });
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';

beforeAll(async () => {
  await SSMParamsService.Instance.updateParams();
});
