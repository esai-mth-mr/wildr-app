import { ChallengeSchema } from '@verdzie/server/challenge/challenge-data-objects/challenge.schema';
import { ActivityVerb } from '@verdzie/server/generated-graphql';
import {
  ScheduledNotificationConfig,
  ScheduledNotificationType,
} from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { Repository } from 'typeorm';
import {
  getChallengeNotificationData,
  getStartAndEndFromChallenge,
  isDaysAway,
  isHalfwayBetween,
  isSameZonedDate,
} from '@verdzie/server/notification-scheduler/notification-config/configs/notification-config.common';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ok } from 'neverthrow';
import { add, differenceInDays, isAfter, isBefore } from 'date-fns';
import { FeedEntity, FeedEntityType } from '@verdzie/server/feed/feed.entity';
import { getFirstFeedPageId } from '@verdzie/server/entities-with-pages-common/entitiesWithPages.common';
import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { InjectRepository } from '@nestjs/typeorm';
import { FeedSchema } from '@verdzie/server/feed/feed.schema';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DateTime } from 'luxon';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { isValidTimezoneOffset } from '@verdzie/server/interceptors/user-timezone-update.interceptor';

type ChallengeCreatorDailyNotificationData = {
  verb: ActivityVerb;
  activityOwnerId: string;
  challengeId: string;
};

@Injectable()
export class ChallengeCreatorDailyNotificationConfig
  implements ScheduledNotificationConfig<ChallengeCreatorDailyNotificationData>
{
  type: ScheduledNotificationType.CHALLENGE_CREATOR_DAILY;
  parentSchema: typeof ChallengeSchema;
  hour = 8;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(ChallengeSchema)
    private readonly challengeRepository: Repository<ChallengeEntity>,
    @InjectRepository(FeedSchema)
    private readonly feedRepository: Repository<FeedEntity>
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
    this.type = ScheduledNotificationType.CHALLENGE_CREATOR_DAILY;
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
        title:
          `Post today’s entry for ${parent.name} and motivate your ` +
          `participants 💯`,
        body: `You're making great progress, keep it up!`,
      });

    const summaryDateForUser = parent.endDate
      ? DateTime.fromJSDate(add(parent.endDate, { days: 1 })).setZone(
          offsetString
        )
      : undefined;

    if (
      summaryDateForUser &&
      isSameZonedDate(dateForUser, summaryDateForUser)
    ) {
      const participantsFeed = await this.feedRepository.findOne(
        getFirstFeedPageId(FeedEntityType.CHALLENGE_PARTICIPANTS, parent.id)
      );
      if (!participantsFeed) {
        this.logger.warn('no participant feed found', {
          recipientId: recipient.id,
          challengeId: parent.id,
        });
        return ok(undefined);
      }
      if (participantsFeed.count === 0) {
        this.logger.warn('no participants found', {
          recipientId: recipient.id,
          challengeId: parent.id,
        });
        return ok(undefined);
      }
      return ok({
        title:
          `${participantsFeed?.count} participants completed your ` +
          `challenge yesterday! 🎉`,
        body: `Tap to view their posts!`,
      });
    }

    return ok(undefined);
  }
}
