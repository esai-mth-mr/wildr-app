import { Logger } from 'winston';
import { JobOptions, Queue } from 'bull';

/**
 * @deprecated Use the `WildrProducer` class and `produce` method instead.
 */
export const queueWithLogging = async <T, P>(
  logger: Logger,
  queue: Queue,
  jobName: string,
  job: T,
  logParams?: P,
  shouldLog?: boolean,
  opts?: JobOptions
) => {
  {
    if (shouldLog) logger.info(`[${jobName}] adding job to queue`, logParams);
    try {
      const res = await queue.add(jobName, job, opts);
      if (shouldLog)
        logger.info(`[${jobName}] completed adding job to queue`, {
          jobId: res.id,
          ...logParams,
        });
    } catch (e) {
      logger.info(`[${jobName}] error when adding job to queue`, logParams);
      throw e;
    }
  }
};
