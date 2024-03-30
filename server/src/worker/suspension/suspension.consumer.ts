import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ActivityService } from '../../activity/activity.service';
import { Job } from 'bull';
import {
  SuspensionRequest,
  SuspensionResponse,
} from '../../request-resposne/suspension-request-response';
import { UserService } from '@verdzie/server/user/user.service';

@Processor('lift-suspension-queue')
export class SuspensionConsumer {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private userService: UserService,
    private activityService: ActivityService
  ) {
    this.logger = this.logger.child({ context: 'SuspensionConsumer' });
  }

  @Process('start-lift-suspension-job')
  async liftSuspension(
    suspensionRequest: Job<SuspensionRequest>
  ): Promise<SuspensionResponse> {
    const usersNeededToBeLifted =
      await this.userService.findAllSuspensionExpired();
    this.logger.debug(
      `UsersNeededToBeLifted`,
      usersNeededToBeLifted?.map(r => r.handle)
    );
    for (const user of usersNeededToBeLifted) {
      await this.userService.removeSuspension(user.id);
    }
    return { status: 'OK' };
  }
}
