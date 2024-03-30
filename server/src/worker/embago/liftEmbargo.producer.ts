import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '../worker.helper';
import { LiftEmbargoRequest } from '../../request-resposne/embargo-request-response';

@Injectable()
export class LiftEmbargoProducer {
  constructor(
    @InjectQueue('lift-embargo-queue') private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {}
  async startLiftEmbargoProcess(liftEmbargoRequest: LiftEmbargoRequest) {
    this.logger.debug(`request`, liftEmbargoRequest);
    await queueWithLogging(
      this.logger,
      this.queue,
      'start-lift-embargo-queue',
      liftEmbargoRequest,
      { ...liftEmbargoRequest }
    );
  }
}
