import { getQueueToken } from '@nestjs/bull';
import { ScheduledNotificationType } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { createMockedTestingModule } from '@verdzie/server/testing/base.module';
import {
  CANCEL_NOTIFICATION_JOB_NAME,
  SCHEDULE_NOTIFICATION_JOB_NAME,
  TIMEPOINT_SCHEDULING_QUEUE_NAME,
  TimepointSchedulingProducer,
} from '@verdzie/server/worker/timepoint-scheduling/timepoint-scheduling.producer';

describe('TimepointSchedulingProducer', () => {
  let producer: TimepointSchedulingProducer;

  beforeEach(async () => {
    const module = await createMockedTestingModule({
      providers: [
        TimepointSchedulingProducer,
        {
          provide: getQueueToken(TIMEPOINT_SCHEDULING_QUEUE_NAME),
          useValue: {
            on: jest.fn(),
            add: jest.fn(),
          },
        },
      ],
    });
    producer = module.get(TimepointSchedulingProducer);
  });

  describe('scheduleNotification', () => {
    it('should create schedule notification job', async () => {
      producer.produce = jest.fn().mockResolvedValue(undefined);
      await producer.scheduleNotification({
        parentId: 'parentId',
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(producer.produce).toHaveBeenCalledWith(
        SCHEDULE_NOTIFICATION_JOB_NAME,
        {
          parentId: 'parentId',
          recipientId: 'recipientId',
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        }
      );
    });
  });

  describe('cancelNotification', () => {
    it('should create cancel notification job', async () => {
      producer.produce = jest.fn().mockResolvedValue(undefined);
      await producer.cancelNotification({
        parentId: 'parentId',
        recipientId: 'recipientId',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      expect(producer.produce).toHaveBeenCalledWith(
        CANCEL_NOTIFICATION_JOB_NAME,
        {
          parentId: 'parentId',
          recipientId: 'recipientId',
          notificationType:
            ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
        }
      );
    });
  });
});
