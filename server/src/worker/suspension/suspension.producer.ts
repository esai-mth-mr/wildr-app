import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { queueWithLogging } from '../worker.helper';
import { SuspensionRequest } from '../../request-resposne/suspension-request-response';

@Injectable()
export class SuspensionProducer {
  constructor(
    @InjectQueue('lift-suspension-queue') private queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger
  ) {
    this.logger = this.logger.child({ context: 'SuspensionProducer' });
  }
  async startSuspensionProcess(suspensionRequest: SuspensionRequest) {
    this.logger.debug(`request`, suspensionRequest);
    await queueWithLogging(
      this.logger,
      this.queue,
      'start-lift-suspension-job',
      suspensionRequest,
      { ...suspensionRequest }
    );
  }
}
