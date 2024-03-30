import { DynamicModule, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { WinstonModule, utilities, WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { join } from 'path';

/**
 * Server's shared winston instance.
 */
let logger: winston.Logger;

function createWinstonTransports() {
  const format = winston.format.combine(
    winston.format.timestamp(),
    utilities.format.nestLike('wildr'),
    winston.format.errors({ stack: true })
  );
  const formatJson = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );
  const transports: Transport[] = [];
  const consoleTransport = new winston.transports.Console({
    format: format,
    level: process.env.CONSOLE_LOG_LEVEL ?? 'debug',
  });
  const consoleTransportJson = new winston.transports.Console({
    format: formatJson,
    level: process.env.CONSOLE_LOG_LEVEL ?? 'debug',
  });
  if (process.env.LOG_DIR && process.env.FILE_LOG_ENABLED !== 'false') {
    transports.push(
      new winston.transports.File({
        level: process.env.FILE_LOG_LEVEL ?? 'info',
        format: formatJson,
        filename: join(process.env.LOG_DIR, 'info.log'),
      })
    );
  }
  if (process.env.CONSOLE_LOG_ENABLED !== 'false') {
    transports.push(
      process.env.CONSOLE_LOG_JSON ? consoleTransportJson : consoleTransport
    );
  }
  return transports;
}

export function getLogger() {
  if (!logger) {
    logger = winston.createLogger({
      level: 'debug',
      exitOnError: true,
      transports: createWinstonTransports(),
    });
    return logger;
  }
  return logger;
}

export class WinstonBeanstalkModule implements NestModule {
  // eslint-disable-next-line
  configure(consumer: MiddlewareConsumer) {}
  static forRoot(): DynamicModule {
    return {
      module: WinstonBeanstalkModule,
      imports: [
        WinstonModule.forRoot({
          instance: getLogger(),
          // Transports are overwritten by the nest.js winston module so we
          // must also add them here.
          transports: createWinstonTransports(),
        }),
      ],
    };
  }
}
