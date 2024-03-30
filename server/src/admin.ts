import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AdminModule } from './admin/admin.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { SSMParamsService } from '@verdzie/server/ssm-params/ssm-params.service';
import { GenericExceptionFilter } from '@verdzie/server/admin/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AdminModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(new ValidationPipe());
  process.env.ADMIN_SERVER_HTTP_URL =
    process.env.ADMIN_SERVER_HTTP_URL ?? 'http://localhost:5001';
  process.env.ADMIN_SERVER_HTTP_PORT =
    process.env.ADMIN_SERVER_HTTP_PORT ?? '6000';
  app.enableCors({
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE'],
  });
  app.useGlobalFilters(new GenericExceptionFilter());
  const assetsPath = join(process.cwd(), 'uploads');
  app.setGlobalPrefix('admin');
  app.useStaticAssets(assetsPath, {
    prefix: '/uploads/',
    index: false,
  });
  await app.listen(process.env.ADMIN_SERVER_HTTP_PORT);
  console.debug(`Admin is running on ${await app.getUrl()}/admin`);
}
SSMParamsService.Instance.updateParams().then(bootstrap);
