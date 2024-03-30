import { InternalServerErrorException } from '@verdzie/server/exceptions/wildr.exception';
import { ActivityVerb } from '@verdzie/server/generated-graphql';
import { ScheduledNotificationSenderService } from '@verdzie/server/notification-scheduler/orchestrator/notification-sender/notification-sender.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';

describe('ScheduledNotificationSenderService', () => {
  let service: ScheduledNotificationSenderService;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [ScheduledNotificationSenderService],
    });
    service = module.get(ScheduledNotificationSenderService);
  });

  describe('send', () => {
    it('should send notification', async () => {
      const result = await service.send({
        fcmToken: 'fcmToken',
        notificationStrings: {
          title: 'title',
          body: 'body',
        },
        notificationData: {
          verb: ActivityVerb.CHALLENGE_CREATED,
        },
      });
      expect(result.isOk()).toBe(true);
      expect(service['fcmService'].sendNotifications).toBeCalledTimes(1);
      expect(service['fcmService'].sendNotifications).toBeCalledWith(
        ['fcmToken'],
        'title',
        'body',
        {
          verb: ActivityVerb.CHALLENGE_CREATED,
        }
      );
    });

    it('should return error if sendNotifications throws', async () => {
      service['fcmService'].sendNotifications = jest
        .fn()
        .mockRejectedValue(new Error('error'));
      const result = await service.send({
        fcmToken: 'fcmToken',
        notificationStrings: {
          title: 'title',
          body: 'body',
        },
        notificationData: {
          verb: ActivityVerb.CHALLENGE_CREATED,
        },
      });
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InternalServerErrorException
      );
    });
  });
});
