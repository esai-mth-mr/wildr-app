import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ActivityService } from '../../activity/activity.service';
import { Job } from 'bull';
import {
  EmbargoOperation,
  EmbargoScope,
  LiftEmbargoRequest,
  LiftEmbargoResponse,
} from '../../request-resposne/embargo-request-response';
import { UserService } from '@verdzie/server/user/user.service';

@Processor('lift-embargo-queue')
export class LiftEmbargoConsumer {
  @Inject(WINSTON_MODULE_PROVIDER)
  private readonly logger: Logger;

  constructor(
    private userService: UserService,
    private activityService: ActivityService
  ) {}

  @Process('start-lift-embargo-queue')
  async liftEmbargo(
    liftEmbargoRequest: Job<LiftEmbargoRequest>
  ): Promise<LiftEmbargoResponse> {
    const usersNeededToBeLifted =
      liftEmbargoRequest.data.scope === EmbargoScope.USERS
        ? await this.userService.findByHandles(
            liftEmbargoRequest.data.userHandles!
          )
        : await this.userService.findAllCommentEmbargoPassed();
    this.logger.debug(
      `UsersNeededToBeLifted`,
      usersNeededToBeLifted?.map(r => r.handle)
    );
    if (usersNeededToBeLifted == undefined) {
      return {
        status: 'ERROR',
        errorMessage: 'Unable to find users',
      };
    }
    for (const user of usersNeededToBeLifted) {
      if (liftEmbargoRequest.data.operation === EmbargoOperation.CREATE) {
        await this.userService.createEmbargo(user.id);
        this.logger.debug('Embargo created for: ', user.id);
      } else if (
        liftEmbargoRequest.data.operation === EmbargoOperation.REMOVE
      ) {
        await this.userService.removeEmbargo(user.id);
        this.logger.debug('Embargo removed for: ', user.id);
        await this.activityService.commentEmbargoEvent(user);
      } else {
        return {
          status: 'ERROR',
          errorMessage: 'Please provide Embargo Operation: CREATE | REMOVE',
        };
      }
    }
    return { status: 'OK' };
  }
}
