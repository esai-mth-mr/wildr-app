import { PostgresTransactionFailedException } from '@verdzie/server/typeorm/postgres-exceptions';
import { Result, err } from 'neverthrow';
import { QueryRunner } from 'typeorm';
import { Logger } from 'winston';

export function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fromTransaction<T, E>({
  queryRunner,
  context,
  txn,
  logger,
  retryCount = 0,
  shouldRetry,
}: {
  queryRunner: QueryRunner;
  context: Record<string, any>;
  txn: ({ queryRunner }: { queryRunner: QueryRunner }) => Promise<Result<T, E>>;
  logger: Logger;
  retryCount?: number;
  shouldRetry?: (error: E | PostgresTransactionFailedException) => boolean;
}): Promise<Result<T, E | PostgresTransactionFailedException>> {
  let result = await transactionToResult<T, E>({
    queryRunner,
    context,
    txn,
    logger,
  });
  for (let attempt = 1; attempt < retryCount + 1; attempt++) {
    if (result.isOk()) {
      break;
    }
    if (shouldRetry && !shouldRetry(result.error)) {
      break;
    }
    logger.warn('transaction failed, retrying...', {
      ...context,
      attempt,
      retryCount,
      error: result.error,
    });
    // We use a jittered exponential backoff to avoid thundering herd.
    await wait(Math.pow(10, attempt) + Math.random() * 100);
    result = await transactionToResult<T, E>({
      queryRunner,
      context,
      txn,
      logger,
    });
  }
  if (result.isErr()) {
    logger.error('transaction failed', {
      ...context,
      error: result.error,
    });
  }
  await queryRunner?.release().catch(error => {
    logger.error('failed to release query runner', {
      context,
      error,
    });
  });
  return result;
}

async function transactionToResult<T, E>({
  queryRunner,
  context,
  txn,
  logger,
}: {
  queryRunner: QueryRunner;
  context: Record<string, any>;
  txn: ({ queryRunner }: { queryRunner: QueryRunner }) => Promise<Result<T, E>>;
  logger: Logger;
}): Promise<Result<T, E | PostgresTransactionFailedException>> {
  const runner = queryRunner;
  try {
    await runner.connect();
    await runner.startTransaction();
    const result = await txn({ queryRunner });
    if (result.isErr()) {
      await runner.rollbackTransaction().catch(error => {
        logger.error('failed to rollback transaction', {
          context,
          error,
        });
      });
      return result;
    }
    await runner.commitTransaction();
    return result;
  } catch (error) {
    if (runner?.isTransactionActive) {
      await runner.rollbackTransaction().catch(error => {
        logger.error('failed to rollback transaction', {
          error,
          ...context,
        });
      });
    }
    logger.error('error during transaction', {
      error,
      ...context,
    });
    return err(
      new PostgresTransactionFailedException({
        error,
        ...context,
      })
    );
  }
}
