import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { UserService } from '@verdzie/server/user/user.service';
import {
  USER_TIMEZONE_UPDATE_JOB_NAME,
  USER_TIMEZONE_UPDATE_QUEUE_NAME,
  UserTimezoneUpdateJob,
} from '@verdzie/server/worker/user-timezone-update/user-timezone-update.producer';
import { Job } from 'bull';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Processor(USER_TIMEZONE_UPDATE_QUEUE_NAME)
export class UserTimezoneUpdateConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userService: UserService
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  @Process(USER_TIMEZONE_UPDATE_JOB_NAME)
  async processTimezoneUpdateJob(job: Job<UserTimezoneUpdateJob>) {
    const result = await this.userService.updateUserTimezoneOffset(job.data);
    if (result.isErr()) {
      throw result.error;
    }
  }
}
