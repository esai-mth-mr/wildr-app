import { ScheduledNotificationType } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import { TimepointSchedulingConsumer } from '@verdzie/server/worker/timepoint-scheduling/timepoint-scheduling.consumer';
import { err, ok } from 'neverthrow';

describe('TimepointSchedulingConsumer', () => {
  let consumer: TimepointSchedulingConsumer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [TimepointSchedulingConsumer],
    });
    consumer = module.get(TimepointSchedulingConsumer);
  });

  describe('scheduleNotification', () => {
    it('should schedule notification', async () => {
      consumer['timepointService'].scheduleNotification = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      await consumer.scheduleNotification({
        data: {
          parentId: 'parentId',
          recipientId: 'recipientId',
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        },
      } as any);
      expect(
        consumer['timepointService'].scheduleNotification
      ).toHaveBeenCalledWith({
        parentId: 'parentId',
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
    });

    it('should throw error if schedule notification fails', async () => {
      consumer['timepointService'].scheduleNotification = jest
        .fn()
        .mockResolvedValue(err(new Error('error')));
      try {
        await consumer.scheduleNotification({
          data: {
            parentId: 'parentId',
            recipientId: 'recipientId',
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          },
        } as any);
        throw new Error('should not reach here');
      } catch (e) {
        expect(e).toEqual(new Error('error'));
      }
    });
  });

  describe('cancelNotification', () => {
    it('should cancel notification', async () => {
      consumer['timepointService'].cancelNotification = jest
        .fn()
        .mockResolvedValue(ok(undefined));
      await consumer.cancelNotification({
        data: {
          parentId: 'parentId',
          recipientId: 'recipientId',
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        },
      } as any);
      expect(
        consumer['timepointService'].cancelNotification
      ).toHaveBeenCalledWith({
        parentId: 'parentId',
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
    });

    it('should throw error if cancel notification fails', async () => {
      consumer['timepointService'].cancelNotification = jest
        .fn()
        .mockResolvedValue(err(new Error('error')));
      try {
        await consumer.cancelNotification({
          data: {
            parentId: 'parentId',
            recipientId: 'recipientId',
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          },
        } as any);
        throw new Error('should not reach here');
      } catch (e) {
        expect(e).toEqual(new Error('error'));
      }
    });
  });
});
