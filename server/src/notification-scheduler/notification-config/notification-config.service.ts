import { Inject, Injectable } from '@nestjs/common';
import { ChallengeSchema } from '@verdzie/server/challenge/challenge-data-objects/challenge.schema';
import {
  DebugData,
  InternalServerErrorException,
  InternalServerErrorExceptionCodes,
  NotFoundException,
  NotFoundExceptionCodes,
} from '@verdzie/server/exceptions/wildr.exception';
import { ActivityVerb } from '@verdzie/server/generated-graphql';
import { ChallengeCreatorDailyNotificationConfig } from '@verdzie/server/notification-scheduler/notification-config/configs/challenge-creator-daily-notification.config';
import { ChallengeParticipantDailyNotificationConfig } from '@verdzie/server/notification-scheduler/notification-config/configs/challenge-participant-daily-notification.config';
import { UserEntity } from '@verdzie/server/user/user.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ok, Result, err } from 'neverthrow';
import { EntitySchema } from 'typeorm';
import { Logger } from 'winston';

export enum ScheduledNotificationType {
  CHALLENGE_CREATOR_DAILY = 1,
  CHALLENGE_PARTICIPANT_DAILY = 2,
}

export interface ScheduledNotificationData {
  verb: ActivityVerb;
  activityOwnerId: string;
  postId?: string;
  challengeId?: string;
  commentId?: string;
  replyId?: string;
}

export type EntityFromEntitySchema<T> = T extends EntitySchema<infer Entity>
  ? Entity
  : never;

export type NotificationParentType = typeof ChallengeSchema;

type GetNotificationData<NotificationData extends ScheduledNotificationData> =
  ({
    parent,
    recipient,
  }: {
    parent: EntityFromEntitySchema<NotificationParentType>;
    recipient: UserEntity;
  }) => Promise<
    Result<NotificationData | undefined, InternalServerErrorException>
  >;

type GetNotificationString<NotificationData extends ScheduledNotificationData> =
  ({
    parent,
    recipient,
    notificationData,
  }: {
    parent: EntityFromEntitySchema<NotificationParentType>;
    recipient: UserEntity;
    notificationData: NotificationData;
  }) => Promise<
    Result<
      { title: string; body: string } | undefined,
      InternalServerErrorException
    >
  >;

type GetScheduledNotificationStartAndEnd = ({
  parentId,
}: {
  parentId: string;
}) => Promise<
  Result<{ start: Date; end?: Date }, InternalServerErrorException>
>;

export interface ScheduledNotificationConfig<
  NotificationData extends ScheduledNotificationData
> {
  type: ScheduledNotificationType;
  parentSchema: NotificationParentType;
  // The hour that the notification should be sent at 8 = 8am, 20 = 8pm
  hour: number;
  getStartAndEnd: GetScheduledNotificationStartAndEnd;
  getNotificationData: GetNotificationData<NotificationData>;
  getNotificationString: GetNotificationString<NotificationData>;
}

type NotificationConfigMap = {
  [key in ScheduledNotificationType]: ScheduledNotificationConfig<ScheduledNotificationData>;
};

@Injectable()
export class NotificationConfigService {
  private readonly notificationConfigs: NotificationConfigMap;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly challengeParticipantDailyConfig: ChallengeParticipantDailyNotificationConfig,
    private readonly challengeCreatorDailyConfig: ChallengeCreatorDailyNotificationConfig
  ) {
    this.notificationConfigs = {
      [ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY]:
        challengeParticipantDailyConfig,
      [ScheduledNotificationType.CHALLENGE_CREATOR_DAILY]:
        challengeCreatorDailyConfig,
    };
  }

  get(
    notificationType: ScheduledNotificationType
  ): Result<
    ScheduledNotificationConfig<ScheduledNotificationData>,
    NotificationConfigNotFoundException
  > {
    const config = this.notificationConfigs[notificationType];
    if (!config)
      return err(
        new NotificationConfigNotFoundException({
          notificationType,
          methodName: 'get',
        })
      );
    return ok(config);
  }
}

export class NotificationConfigNotFoundException extends NotFoundException {
  constructor(debugData: DebugData<NotFoundExceptionCodes> = {}) {
    super('Notification config not found', {
      ...debugData,
      exceptionCode: NotFoundExceptionCodes.NOTIFICATION_CONFIG_NOT_FOUND,
    });
  }
}

export class BadNotificationConfigException extends InternalServerErrorException {
  constructor(debugData: DebugData<NotFoundExceptionCodes> = {}) {
    super('Bad notification config', {
      ...debugData,
      exceptionCode:
        InternalServerErrorExceptionCodes.NOTIFICATION_CONFIG_ERROR,
    });
  }
}
