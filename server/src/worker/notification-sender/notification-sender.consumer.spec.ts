import { ActivityVerb } from '@verdzie/server/generated-graphql';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { ScheduledNotificationSenderConsumer } from '@verdzie/server/worker/notification-sender/notification-sender.consumer';
import { err, ok } from 'neverthrow';

describe('ScheduledNotificationSenderConsumer', () => {
  let consumer: ScheduledNotificationSenderConsumer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [ScheduledNotificationSenderConsumer],
    });
    consumer = module.get(ScheduledNotificationSenderConsumer);
  });

  describe('sendNotification', () => {
    it('should send notification', async () => {
      consumer['scheduledNotificationSender'].send = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      await consumer.sendNotification({
        data: {
          fcmToken: 'fcmToken',
          notificationStrings: {
            title: 'title',
            body: 'body',
          },
          notificationData: {
            route: 'route',
            verb: ActivityVerb.CHALLENGE_CREATED,
          },
        },
      } as any);
      expect(consumer['scheduledNotificationSender'].send).toHaveBeenCalledWith(
        {
          fcmToken: 'fcmToken',
          notificationStrings: {
            title: 'title',
            body: 'body',
          },
          notificationData: {
            route: 'route',
            verb: ActivityVerb.CHALLENGE_CREATED,
          },
        }
      );
    });

    it('should throw error if send notification fails', async () => {
      const error = new Error('error');
      consumer['scheduledNotificationSender'].send = jest
        .fn()
        .mockResolvedValue(err(error));
      try {
        await consumer.sendNotification({
          data: {
            fcmToken: 'fcmToken',
            notificationStrings: {
              title: 'title',
              body: 'body',
            },
            notificationData: {
              route: 'route',
              verb: ActivityVerb.CHALLENGE_CREATED,
            },
          },
        } as any);
        throw new Error('should not reach here');
      } catch (e) {
        expect(e).toBe(error);
      }
    });
  });
});
