import { wait } from '@verdzie/server/common/transaction-result';
import { Result } from 'neverthrow';

export async function retryResultWithBackoff<T, E>({
  fn,
  retryCount,
  logFailure,
  logRetry,
  shouldRetry,
}: {
  fn: () => Promise<Result<T, E>>;
  retryCount: number;
  logRetry?: ({ error, attempt }: { error: unknown; attempt: number }) => void;
  logFailure?: ({
    error,
    attempt,
  }: {
    error: unknown;
    attempt: number;
  }) => void;
  shouldRetry?: (error: E) => boolean;
}): Promise<Result<T, E>> {
  let result = await fn();
  if (result.isOk()) {
    return result;
  }
  for (let attempt = 1; attempt < retryCount + 1; attempt++) {
    await wait(Math.pow(10, attempt) + Math.random() * 100);
    result = await fn();
    if (result.isOk()) {
      return result;
    }
    if (logRetry && attempt < retryCount) {
      logRetry({ error: result.error, attempt });
    } else if (logFailure && attempt === retryCount) {
      logFailure({ error: result.error, attempt });
    }
    if (shouldRetry && !shouldRetry(result.error)) {
      return result;
    }
  }
  return result;
}
