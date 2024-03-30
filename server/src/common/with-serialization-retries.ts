import { QueryFailedError } from 'typeorm';

type AsyncFunction = (...args: any[]) => Promise<any>;

/**
 * Classical decorator function that retries passed in transactions if
 * serialization errors occur.
 */
export function withSerializationRetries<F extends AsyncFunction>(
  tx: F,
  retryCount = 2,
  ctx: any
) {
  return async function (this: any, ...args: Parameters<F>) {
    let retries = 0;
    while (retries <= retryCount) {
      retries++;
      try {
        const result = await tx.apply(ctx, args);
        return result;
      } catch (e) {
        if (e instanceof QueryFailedError && e.driverError.code == '40001') {
          ctx.logger.error('serialization error retrying transaction...');
          // Exponential backoff based on retry count
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(5, retries) + Math.random() * 25)
          );
          continue;
        }
        throw e;
      }
    }
    throw new Error('max retries exceeded');
  } as F;
}
