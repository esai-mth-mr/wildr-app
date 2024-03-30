import { ScheduledNotificationType } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { ScheduledNotificationBuilderConsumer } from '@verdzie/server/worker/scheduled-notification-builder/scheduled-notification-builder.consumer';
import { err, ok } from 'neverthrow';

describe('ScheduledNotificationBuilderConsumer', () => {
  let consumer: ScheduledNotificationBuilderConsumer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [ScheduledNotificationBuilderConsumer],
    });
    consumer = module.get(ScheduledNotificationBuilderConsumer);
  });

  describe('scheduleNotification', () => {
    it('should schedule notification', async () => {
      consumer['scheduledNotificationBuilder'].buildAndEnqueue = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      await consumer.scheduleNotification({
        data: {
          parentId: 'parentId',
          items: [
            {
              recipientId: 'recipientId',
              notificationType:
                ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
            },
          ],
        },
      } as any);
      expect(
        consumer['scheduledNotificationBuilder'].buildAndEnqueue
      ).toHaveBeenCalledWith({
        parentId: 'parentId',
        items: [
          {
            recipientId: 'recipientId',
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          },
        ],
      });
    });

    it('should throw error if schedule notification fails', async () => {
      consumer['scheduledNotificationBuilder'].buildAndEnqueue = jest
        .fn()
        .mockResolvedValue(err(new Error('error')));
      try {
        await consumer.scheduleNotification({
          data: {
            parentId: 'parentId',
            items: [
              {
                recipientId: 'recipientId',
                notificationType:
                  ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
              },
            ],
          },
        } as any);
        throw new Error('should not reach here');
      } catch (e) {
        expect(e).toEqual(new Error('error'));
      }
    });
  });
});
