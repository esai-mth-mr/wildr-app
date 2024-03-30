import { getQueueToken } from '@nestjs/bull';
import { ActivityVerb } from '@verdzie/server/generated-graphql';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import {
  SCHEDULED_NOTIFICATION_SENDER_QUEUE_NAME,
  SCHEDULED_NOTIFICATION_SEND_JOB_NAME,
  ScheduledNotificationSenderProducer,
} from '@verdzie/server/worker/notification-sender/notification-sender.producer';

describe('ScheduledNotificationSenderProducer', () => {
  let producer: ScheduledNotificationSenderProducer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        ScheduledNotificationSenderProducer,
        {
          provide: getQueueToken(SCHEDULED_NOTIFICATION_SENDER_QUEUE_NAME),
          useValue: {
            on: jest.fn(),
            add: jest.fn(),
          },
        },
      ],
    });
    producer = module.get(ScheduledNotificationSenderProducer);
  });

  describe('sendNotification', () => {
    it('should send notification', async () => {
      const result = await producer.sendNotification({
        fcmToken: 'fcmToken',
        notificationStrings: {
          title: 'title',
          body: 'body',
        },
        notificationData: {
          route: 'route',
          verb: ActivityVerb.CHALLENGE_CREATED,
        },
      });
      expect(result.isOk()).toBe(true);
      expect((producer['queue'] as any).add).toHaveBeenCalledWith(
        SCHEDULED_NOTIFICATION_SEND_JOB_NAME,
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
        },
        {}
      );
    });

    it('should throw error if send notification fails', async () => {
      (producer['queue'] as any).add = jest
        .fn()
        .mockRejectedValue(new Error('error'));
      const result = await producer.sendNotification({
        fcmToken: 'fcmToken',
        notificationStrings: {
          title: 'title',
          body: 'body',
        },
        notificationData: {
          verb: ActivityVerb.CHALLENGE_CREATED,
          route: 'route',
        },
      });
      expect(result.isErr()).toBe(true);
    });
  });
});
