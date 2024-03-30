import { Process, Processor } from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { ActivityService } from '@verdzie/server/activity/activity.service';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { RingColor, UserService } from '@verdzie/server/user/user.service';
import { Job } from 'bull';
import { differenceInDays } from 'date-fns';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  UpdateScoreDataJob,
  UserScoreDataRelatedActionEnum,
} from './scoreData.producer';

@Processor('score-data-queue')
export class ScoreDataConsumer {
  private archiveDays: number;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly userService: UserService,
    private activityService: ActivityService
  ) {
    this.logger = this.logger.child({ context: 'ScoreDataConsumer' });
    console.info('UpdateUserScoreDataConsumer created');
    const archiveDaysInput = parseInt(
      process.env.USER_SCORE_ARCHIVE_PERIOD_DAYS ?? '0'
    );
    this.archiveDays = archiveDaysInput > 0 ? archiveDaysInput : 7;
  }

  @Process('update-score-data-job')
  async updateScoreData(job: Job<UpdateScoreDataJob>) {
    const data: UpdateScoreDataJob = job.data;
    this.logger.debug('Updating score data', {
      user: data.userId,
      action: UserScoreDataRelatedActionEnum[data.action],
    });
    const user = await this.userService.findById(data.userId, {
      relations: [UserEntity.kActivityStreamRelation],
    });
    if (!user) {
      this.logger.error('User not found!');
      return;
    }
    const currentDate = new Date();
    if (!user.scoreDataLastArchivedAt)
      user.scoreDataLastArchivedAt = currentDate;
    //Check for last updated timestamp
    const daysBetweenDates = differenceInDays(
      currentDate,
      user.scoreDataLastArchivedAt
    );
    if (daysBetweenDates >= this.archiveDays) {
      user.updateTotalScore();
      user.archiveCurrentScore(currentDate);
    }
    const previousScoreColor = this.userService.getRingColor(user.score);
    user.updateScore(data.action);
    const currentScoreColor: RingColor = this.userService.getRingColor(
      user.score
    );
    if (currentScoreColor > previousScoreColor) {
      //Send celebration notification
      this.logger.debug(`${user.handle} ring color improved`, {
        currentScoreColor,
        previousScoreColor,
        score: user.score,
        handle: user.handle,
      });
      await this.activityService.ringImprovedEvent(
        user,
        this.userService.getRingColorName(currentScoreColor),
        user.score.toString()
      );
    } else {
      await this.userService.save(user);
    }
  }
}
