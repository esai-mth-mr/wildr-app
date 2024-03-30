import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { ChallengeNotificationService } from './challenge-notification.service';
import { ScheduledNotificationType } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { ChallengeEntityFake } from '@verdzie/server/challenge/testing/challenge-entity.fake';

describe('ChallengeNotificationService', () => {
  let service: ChallengeNotificationService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [ChallengeNotificationService],
    });
    service = module.get(ChallengeNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('subscribeToChallengeNotifications', () => {
    it('should subscribe to challenge creator notifications', async () => {
      const challenge = ChallengeEntityFake();
      const userId = challenge.authorId;
      await service.subscribeToChallengeNotifications({
        challenge,
        userId,
      });
      expect(
        service['timepointSchedulingProducer'].scheduleNotification
      ).toHaveBeenCalledWith({
        parentId: challenge.id,
        recipientId: userId,
        notificationType: ScheduledNotificationType.CHALLENGE_CREATOR_DAILY,
      });
    });

    it('should subscribe to challenge participant notifications', async () => {
      const challenge = ChallengeEntityFake();
      const userId = 'userId';
      await service.subscribeToChallengeNotifications({
        challenge,
        userId,
      });
      expect(
        service['timepointSchedulingProducer'].scheduleNotification
      ).toHaveBeenCalledWith({
        parentId: challenge.id,
        recipientId: userId,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
    });
  });

  describe('unsubscribeFromChallengeNotifications', () => {
    it('should unsubscribe from challenge creator notifications', async () => {
      const challenge = ChallengeEntityFake();
      const userId = challenge.authorId;
      await service.unsubscribeFromChallengeNotifications({
        challenge,
        userId,
      });
      expect(
        service['timepointSchedulingProducer'].cancelNotification
      ).toHaveBeenCalledWith({
        parentId: challenge.id,
        recipientId: userId,
        notificationType: ScheduledNotificationType.CHALLENGE_CREATOR_DAILY,
      });
    });

    it('should unsubscribe from challenge participant notifications', async () => {
      const challenge = ChallengeEntityFake();
      const userId = 'userId';
      await service.unsubscribeFromChallengeNotifications({
        challenge,
        userId,
      });
      expect(
        service['timepointSchedulingProducer'].cancelNotification
      ).toHaveBeenCalledWith({
        parentId: challenge.id,
        recipientId: userId,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
    });
  });

  describe('subscribeToCreatorDailyChallenge', () => {
    it('should schedule the challenge creator daily notification', async () => {
      const challengeId = 'challengeId';
      const userId = 'userId';
      await service.subscribeToCreatorDailyChallenge({
        userId,
        challengeId,
      });
      expect(
        service['timepointSchedulingProducer'].scheduleNotification
      ).toHaveBeenCalledWith({
        parentId: challengeId,
        recipientId: userId,
        notificationType: ScheduledNotificationType.CHALLENGE_CREATOR_DAILY,
      });
    });
  });

  describe('unsubscribeFromCreatorDailyChallenge', () => {
    it('should cancel the challenge creator daily notification', async () => {
      const challengeId = 'challengeId';
      const userId = 'userId';
      await service.unsubscribeFromCreatorDailyChallenge({
        userId,
        challengeId,
      });
      expect(
        service['timepointSchedulingProducer'].cancelNotification
      ).toHaveBeenCalledWith({
        parentId: challengeId,
        recipientId: userId,
        notificationType: ScheduledNotificationType.CHALLENGE_CREATOR_DAILY,
      });
    });
  });

  describe('subscribeToParticipantDailyChallenge', () => {
    it('should subscribe to challenge participant daily notifications', async () => {
      const challengeId = 'challengeId';
      const userId = 'userId';
      await service.subscribeToParticipantDailyChallenge({
        userId,
        challengeId,
      });
      expect(
        service['timepointSchedulingProducer'].scheduleNotification
      ).toHaveBeenCalledWith({
        parentId: challengeId,
        recipientId: userId,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
    });
  });

  describe('unsubscribeFromParticipantDailyChallenge', () => {
    it('should cancel the challenge participant daily notification', async () => {
      const challengeId = 'challengeId';
      const userId = 'userId';
      await service.unsubscribeFromParticipantDailyChallenge({
        userId,
        challengeId,
      });
      expect(
        service['timepointSchedulingProducer'].cancelNotification
      ).toHaveBeenCalledWith({
        parentId: challengeId,
        recipientId: userId,
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
    });
  });
});
