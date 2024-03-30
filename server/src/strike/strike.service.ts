import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UserService } from '@verdzie/server/user/user.service';
import { ActivityService } from '@verdzie/server/activity/activity.service';

@Injectable()
export class StrikeService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private userService: UserService,
    private activityService: ActivityService
  ) {
    this.logger = this.logger.child({ context: 'StrikeService' });
  }
  async imposeStrike(userId: string, reportReviewRequestId: string) {
    this.logger.debug(`UserStrikeReceived`);
    const user = await this.userService.findById(userId);
    if (!user) {
      this.logger.error('User not found');
      return;
    }
    const currentTime = new Date();
    user.updateTotalScore();
    user.archiveCurrentScore(currentTime);
    user.addStrike(currentTime);
    await this.userService.save(user);
    //TODO: Send notification
    await this.activityService.strikeEvent(
      user,
      user.strikeData?.currentStrikeCount ?? 0,
      reportReviewRequestId
    );
    if (user.strikeData?.currentStrikeCount ?? 0 > 2) {
      //Kick out the user
    }
  }
}
