import { ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationException } from './exceptions/ValidationException';
import { SSMParamsService } from './ssm-params/ssm-params.service';
import { UserTimezoneUpdateInterceptor } from '@verdzie/server/interceptors/user-timezone-update.interceptor';

export async function bootstrap() {
  console.log('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(
    new ValidationPipe({
      validationError: {
        target: false,
      },
      errorHttpStatusCode: 400,
      exceptionFactory: (errors: ValidationError[]): ValidationException => {
        return new ValidationException(errors);
      },
    })
  );
  if (process.env.ENABLE_USER_TIMEZONE_INTERCEPTOR === 'true') {
    app.useGlobalInterceptors(app.get(UserTimezoneUpdateInterceptor));
  }
  process.env.SERVER_HTTP_PORT = process.env.SERVER_HTTP_PORT ?? '5000';
  process.env.SERVER_HTTP_HOST =
    process.env.SERVER_HTTP_HOST ?? 'local.api.verdzie.com';
  process.env.ADMIN_SERVER_HTTP_PORTS =
    process.env.ADMIN_SERVER_HTTP_PORTS ?? '6060';
  const assetsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(assetsPath, {
    prefix: '/uploads/',
    index: false,
  });
  app.set('trust proxy', true);
  await app.listen(process.env.SERVER_HTTP_PORT);
  if (
    !process.env.WORKER_ELASTIC_CACHE_ENDPOINT ||
    process.env.WORKER_ELASTIC_CACHE_ENDPOINT === ''
  ) {
    throw Error(
      'Specify the WORKER_ELASTIC_CACHE_ENDPOINT environment variable'
    );
  }
  console.debug(`Application is running on: ${await app.getUrl()}`);
}

SSMParamsService.Instance.updateParams().then(bootstrap);
