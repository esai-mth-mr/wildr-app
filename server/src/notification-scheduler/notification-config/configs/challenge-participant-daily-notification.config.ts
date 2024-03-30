import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ChallengeSchema } from '@verdzie/server/challenge/challenge-data-objects/challenge.schema';
import { ActivityVerb } from '@verdzie/server/generated-graphql';
import {
  ScheduledNotificationConfig,
  ScheduledNotificationType,
} from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { differenceInDays, isAfter, isBefore } from 'date-fns';
import { ok } from 'neverthrow';
import { Repository } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Logger } from 'winston';
import {
  getChallengeNotificationData,
  getStartAndEndFromChallenge,
  isDaysAway,
  isHalfwayBetween,
  isSameZonedDate,
} from '@verdzie/server/notification-scheduler/notification-config/configs/notification-config.common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { isValidTimezoneOffset } from '@verdzie/server/interceptors/user-timezone-update.interceptor';
import { DateTime } from 'luxon';

export type ChallengeDailyNudgeNotificationData = {
  verb: ActivityVerb;
  activityOwnerId: string;
  challengeId: string;
};

@Injectable()
export class ChallengeParticipantDailyNotificationConfig
  implements ScheduledNotificationConfig<ChallengeDailyNudgeNotificationData>
{
  public type: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY;
  public parentSchema: typeof ChallengeSchema;
  public hour = 8;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(ChallengeSchema)
    private readonly challengeRepository: Repository<ChallengeEntity>
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
    this.type = ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY;
    this.parentSchema = ChallengeSchema;
  }

  async getStartAndEnd({ parentId }: { parentId: string }) {
    return getStartAndEndFromChallenge({
      challengeId: parentId,
      challengeRepo: this.challengeRepository,
    });
  }

  async getNotificationData({
    parent,
    recipient,
  }: {
    parent: ChallengeEntity;
    recipient: UserEntity;
  }) {
    return getChallengeNotificationData({ parent, recipientId: recipient.id });
  }

  async getNotificationString({
    parent,
    recipient,
  }: {
    parent: ChallengeEntity;
    recipient: UserEntity;
  }) {
    if (!isValidTimezoneOffset(recipient.localizationData?.timezoneOffset)) {
      this.logger.warn('Invalid timezone offset', {
        userId: recipient.id,
        offset: recipient.localizationData?.timezoneOffset,
      });
      return ok(undefined);
    }

    const offsetString = `UTC${recipient.localizationData?.timezoneOffset}`;
    const dateForUser = DateTime.now().setZone(offsetString);
    const startForUser = DateTime.fromJSDate(parent.startDate).setZone(
      offsetString
    );

    if (isSameZonedDate(dateForUser, startForUser))
      return ok({
        title: `${parent.name} is starting today! 🗓️`,
        body: `Tap to start posting!`,
      });

    if (parent.endDate && isDaysAway({ dayCount: 5, date: parent.endDate }))
      return ok({
        title: `There's only 5 days left of ${parent.name} ⏰`,
        body: `You're almost there, finish strong!`,
      });

    if (
      parent.endDate &&
      differenceInDays(parent.endDate, parent.startDate) > 15 &&
      isHalfwayBetween({
        start: parent.startDate,
        end: parent.endDate,
      })
    )
      return ok({
        title: `You're halfway through ${parent.name}! 🎉`,
        body: `Keep up the good work!`,
      });

    if (
      isAfter(new Date(), parent.startDate) &&
      (!parent.endDate || isBefore(new Date(), parent.endDate))
    )
      return ok({
        title: `⏰ It's time to post for ${parent.name}`,
        body: `You're making great progress, keep it up!`,
      });

    return ok(undefined);
  }
}
