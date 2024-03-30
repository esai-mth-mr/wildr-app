import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { SSMParamsService } from './ssm-params/ssm-params.service';
import { WorkerModule } from './worker/worker.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(WorkerModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  process.env.WORKER_HTTP_PORT = process.env.WORKER_HTTP_PORT ?? '4001';
  process.env.SERVER_HTTP_HOST =
    process.env.SERVER_HTTP_HOST ?? 'local.app.verdzie.com';
  await app.listen(process.env.WORKER_HTTP_PORT);
  console.debug(`Worker is running on ${await app.getUrl()}`);
}
SSMParamsService.Instance.updateParams().then(bootstrap);
// bootstrap();
