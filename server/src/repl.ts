import { repl } from '@nestjs/core';
import { SSMParamsService } from './ssm-params/ssm-params.service';
import { AppModule } from './app.module';

async function bootstrap() {
  await repl(AppModule);
}
console.log('[Wildr REPL] initialization started...');
SSMParamsService.Instance.updateParams().then(bootstrap);
console.log('[Wildr REPL] initialization complete');
