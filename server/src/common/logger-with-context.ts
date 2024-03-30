import { Logger } from 'winston';

const loggerMethods = ['info', 'warn', 'error', 'debug'] as const;

export type EphemeralLogger = {
  [key in typeof loggerMethods[number]]: (
    message: string,
    ...args: any[]
  ) => Logger;
};

export function loggerWithMethodContext({
  methodName,
  logger,
}: {
  methodName: string;
  logger: Logger;
}): EphemeralLogger {
  const wrappedLogger = {} as EphemeralLogger;
  for (const loggerMethod of loggerMethods) {
    wrappedLogger[loggerMethod] = function (message: string, ...args: any[]) {
      return logger[loggerMethod](`[${methodName}] ${message}`, {
        method: methodName,
        ...args,
      });
    };
  }
  return wrappedLogger;
}
