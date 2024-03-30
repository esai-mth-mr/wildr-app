import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { WildrProducer } from '@verdzie/server/worker/common/wildrProducer';
import { Creator } from '@verdzie/server/admin/creator-users/creator';
import {
  CREATE_CREATOR_JOB,
  CREATE_CREATOR_QUEUE_NAME,
} from '@verdzie/server/admin/creator-users/creator-user-queue-constants';

@Injectable()
export class CreateCreatorAccountProducer extends WildrProducer {
  constructor(
    @InjectQueue(CREATE_CREATOR_QUEUE_NAME)
    protected queue: Queue,
    @Inject(WINSTON_MODULE_PROVIDER)
    protected readonly logger: Logger
  ) {
    super(queue);
    this.logger = logger.child({ context: this.constructor.name });
  }

  async createCreatorAccount(creator: Creator) {
    await this.produce(CREATE_CREATOR_JOB, creator);
  }
}
