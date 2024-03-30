import { Inject, Injectable } from '@nestjs/common';
import { ChallengeEntity } from '@verdzie/server/challenge/challenge-data-objects/challenge.entity';
import { ScheduledNotificationType } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { TimepointSchedulingProducer } from '@verdzie/server/worker/timepoint-scheduling/timepoint-scheduling.producer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class ChallengeNotificationService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
    private readonly timepointSchedulingProducer: TimepointSchedulingProducer
  ) {
    this.logger = this.logger.child({ context: this.constructor.name });
  }

  async subscribeToChallengeNotifications({
    challenge,
    userId,
  }: {
    challenge: ChallengeEntity;
    userId: string;
  }): Promise<void> {
    if (process.env.SCHEDULED_NOTIFICATIONS_ENABLED === 'true') {
      if (challenge.authorId === userId) {
        await this.subscribeToCreatorDailyChallenge({
          userId,
          challengeId: challenge.id,
        });
      } else {
        await this.subscribeToParticipantDailyChallenge({
          userId,
          challengeId: challenge.id,
        });
      }
    }
  }

  async unsubscribeFromChallengeNotifications({
    challenge,
    userId,
  }: {
    challenge: ChallengeEntity;
    userId: string;
  }): Promise<void> {
    if (process.env.SCHEDULED_NOTIFICATIONS_ENABLED === 'true') {
      if (challenge.authorId === userId) {
        await this.unsubscribeFromCreatorDailyChallenge({
          userId,
          challengeId: challenge.id,
        });
      } else {
        await this.unsubscribeFromParticipantDailyChallenge({
          userId,
          challengeId: challenge.id,
        });
      }
    }
  }

  async subscribeToCreatorDailyChallenge({
    userId,
    challengeId,
  }: {
    userId: string;
    challengeId: string;
  }): Promise<void> {
    await this.timepointSchedulingProducer.scheduleNotification({
      parentId: challengeId,
      recipientId: userId,
      notificationType: ScheduledNotificationType.CHALLENGE_CREATOR_DAILY,
    });
  }

  async unsubscribeFromCreatorDailyChallenge({
    userId,
    challengeId,
  }: {
    userId: string;
    challengeId: string;
  }): Promise<void> {
    await this.timepointSchedulingProducer.cancelNotification({
      parentId: challengeId,
      recipientId: userId,
      notificationType: ScheduledNotificationType.CHALLENGE_CREATOR_DAILY,
    });
  }

  async subscribeToParticipantDailyChallenge({
    userId,
    challengeId,
  }: {
    userId: string;
    challengeId: string;
  }): Promise<void> {
    await this.timepointSchedulingProducer.scheduleNotification({
      parentId: challengeId,
      recipientId: userId,
      notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
    });
  }

  async unsubscribeFromParticipantDailyChallenge({
    userId,
    challengeId,
  }: {
    userId: string;
    challengeId: string;
  }): Promise<void> {
    await this.timepointSchedulingProducer.cancelNotification({
      parentId: challengeId,
      recipientId: userId,
      notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
    });
  }
}
