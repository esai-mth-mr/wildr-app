import {
  DynamicModule,
  Global,
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  Provider,
} from '@nestjs/common';
import { StatsD } from 'hot-shots';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Global()
@Module({})
export class HotShotsModule implements NestModule {
  @Inject(WINSTON_MODULE_PROVIDER)
  static logger: Logger;

  // eslint-disable-next-line
  configure(consumer: MiddlewareConsumer) {}

  public static forRoot(): DynamicModule {
    const StatsDProvider: Provider<StatsD> = {
      provide: StatsD,
      useValue: new StatsD({
        port: parseInt(process.env.STATSD_PORT ?? ''),
        globalTags: {
          env: process.env.NODE_ENV ?? 'development',
          service: process.env.CONTAINER_NAME ?? '',
          awsRegion: process.env.AWS_REGION ?? '',
          containerImageTag: process.env.CONTAINER_IMAGE_TAG ?? '',
        },
        errorHandler: (error: Error) => {
          this.logger.error('Error while initializing stats client', {
            error,
            context: 'StatsD',
          });
        },
      }),
    };

    return {
      module: HotShotsModule,
      providers: [StatsDProvider],
      exports: [StatsDProvider],
    };
  }
}
