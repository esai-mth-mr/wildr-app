import { getQueueToken } from '@nestjs/bull';
import { ScheduledNotificationType } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import {
  SCHEDULED_NOTIFICATION_BUILDER_QUEUE_NAME,
  ScheduledNotificationBuilderProducer,
} from '@verdzie/server/worker/scheduled-notification-builder/scheduled-notification-builder.producer';

describe('ScheduledNotificationBuilderProducer', () => {
  describe('createJob', () => {
    it('should produce a job', async () => {
      const producer = (
        await createMockedTestingModule({
          providers: [
            ScheduledNotificationBuilderProducer,
            {
              provide: getQueueToken(SCHEDULED_NOTIFICATION_BUILDER_QUEUE_NAME),
              useValue: {
                add: jest.fn(),
                on: jest.fn(),
              },
            },
          ],
        })
      ).get(ScheduledNotificationBuilderProducer);
      const items = [
        {
          recipientId: 'recipientId',
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        },
      ];
      const result = await producer.createJob({
        parentId: 'parentId',
        items,
      });
      expect(result.isOk()).toBeTruthy();
      expect(producer['queue'].add).toHaveBeenCalledWith(
        'scheduled-notification-builder-build-job',
        {
          parentId: 'parentId',
          items,
        },
        {}
      );
    });

    it('should return an error if the job could not be produced', async () => {
      const producer = (
        await createMockedTestingModule({
          providers: [
            ScheduledNotificationBuilderProducer,
            {
              provide: getQueueToken(SCHEDULED_NOTIFICATION_BUILDER_QUEUE_NAME),
              useValue: {
                add: jest.fn().mockRejectedValue(new Error('error')),
                on: jest.fn(),
              },
            },
          ],
        })
      ).get(ScheduledNotificationBuilderProducer);
      const items = [
        {
          recipientId: 'recipientId',
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        },
      ];
      const result = await producer.createJob({
        parentId: 'parentId',
        items,
      });
      expect(result.isErr()).toBeTruthy();
      expect(producer['queue'].add).toHaveBeenCalledWith(
        'scheduled-notification-builder-build-job',
        {
          parentId: 'parentId',
          items,
        },
        {}
      );
    });
  });
});
