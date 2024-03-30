import { Job, JobOptions, Queue } from 'bull';
import { Logger } from 'winston';
import {
  getOrCreateCounter,
  getOrCreateHistogram,
} from '@verdzie/server/opentelemetry/openTelemetry.decorators';
import { Counter, Histogram } from '@opentelemetry/api';
import { Result, err, ok } from 'neverthrow';
import {
  DebugData,
  InternalServerErrorException,
  InternalServerErrorExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';

/**
 * Abstract class that adds enhanced logging and open telemetry metrics to
 * bull queue producers. Note: use the `produce` method of the class to create
 * jobs.
 */
export abstract class WildrProducer {
  protected logger: Logger;
  protected queue: Queue;
  private latencyHistogram: Histogram;
  private errorCounter: Counter;
  private successCounter: Counter;
  private opts: { skipJobPayloadLogging?: boolean };

  constructor(queue: Queue, opts: { skipJobPayloadLogging?: boolean } = {}) {
    this.queue = queue;
    this.opts = opts;

    this.latencyHistogram = getOrCreateHistogram(
      `wildr.${this.queue.name}.latency`
    );
    this.errorCounter = getOrCreateCounter(
      `wildr.${this.queue.name}.error-counter`
    );
    this.successCounter = getOrCreateCounter(
      `wildr.${this.queue.name}.success-counter`
    );

    this.queue.on('failed', (job: Job, error: any) => {
      this.logger.error(`${job.name} failed: ${error}`, {
        job,
      });
      this.errorCounter.add(1);
    });

    this.queue.on('completed', (job: Job) => {
      const e2eTime = Date.now() - job.timestamp;
      let executionTime: number | undefined;
      if (job.finishedOn && job.processedOn) {
        executionTime = job.finishedOn - job.processedOn;
      }
      this.logger.info(
        `${job.name} took ${e2eTime}ms e2e and ${executionTime}ms to execute`,
        {
          context: this.constructor.name,
          ...(this.opts.skipJobPayloadLogging ? {} : { job }),
        }
      );
      this.successCounter.add(1);
      if (executionTime) this.latencyHistogram.record(e2eTime);
    });
  }

  async produce(jobName: string, data: any, opts: JobOptions = {}) {
    this.logger.info(`adding ${jobName} job to queue `);
    try {
      const job = await this.queue.add(jobName, data, opts);
      this.logger.info(`added ${jobName} job to queue `, {
        ...(this.opts?.skipJobPayloadLogging ? {} : { job }),
      });
    } catch (error) {
      this.logger.error(`error adding job to queue `, {
        job: { data, jobName },
      });
    }
  }

  async produceUnsafe(jobName: string, data: any, opts?: JobOptions) {
    this.logger.info(`adding ${jobName} job to queue`);
    await this.queue.add(jobName, data, opts || {});
    this.logger.info(`added ${jobName} job to queue`, {
      ...(this.opts?.skipJobPayloadLogging ? {} : { job: { data, jobName } }),
    });
  }

  async produceResult({
    jobName,
    jobData,
  }: {
    jobName: string;
    jobData: any;
  }): Promise<Result<Job<any>, JobProductionException>> {
    try {
      this.logger.info(`adding ${jobName} job to queue`);
      const job = await this.queue.add(jobName, jobData);
      this.logger.info(`added ${jobName} job to queue`, {
        ...(this.opts?.skipJobPayloadLogging ? {} : { job }),
      });
      return ok(job);
    } catch (error) {
      this.logger.error(`error adding job to queue `, {
        job: { jobName },
      });
      return err(new JobProductionException({ error, jobName }));
    }
  }

  async produceBulkResult({
    jobName,
    jobData,
  }: {
    jobName: string;
    jobData: any[];
  }): Promise<Result<Job<any>[], JobProductionException>> {
    try {
      this.logger.info(`adding ${jobName} jobs to queue`);
      const jobs = await this.queue.addBulk(
        jobData.map(data => ({ name: jobName, data }))
      );
      return ok(jobs);
    } catch (error) {
      this.logger.error(`error adding job to queue `, {
        job: { jobName },
      });
      return err(new JobProductionException({ error, jobName }));
    }
  }
}

export class JobProductionException extends InternalServerErrorException {
  constructor(debugData: DebugData<InternalServerErrorExceptionCodes> = {}) {
    super('Error producing job', {
      ...debugData,
      code: InternalServerErrorExceptionCodes.JOB_PRODUCTION_ERROR,
    });
  }
}
