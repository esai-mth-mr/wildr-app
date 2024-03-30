import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CreateCreatorAccountProducer } from '@verdzie/server/worker/create-creator-account/createCreatorAccount.producer';
import { Creator } from '@verdzie/server/admin/creator-users/creator';

@Injectable()
export class AdminCreatorUserService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly worker: CreateCreatorAccountProducer
  ) {
    this.logger = this.logger.child({ context: AdminCreatorUserService.name });
  }

  async createUsersFromJson(creators: Creator[]): Promise<string> {
    let count = 0;
    for (const creator of creators) {
      await this.worker.createCreatorAccount(creator);
      count++;
    }
    return `${count} jobs created; pls check Slack#admin-server-comms channel for the updates.`;
  }
}
