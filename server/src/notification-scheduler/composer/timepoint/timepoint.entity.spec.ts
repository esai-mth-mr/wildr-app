import {
  TimepointEntity,
  TimepointState,
  fromTimepointNotificationTuple,
  toTimepointNotificationTuple,
} from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.entity';
import { ScheduledNotificationType } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';
import { useFakeTimers } from 'sinon';

describe('TimepointEntity', () => {
  describe('constructor', () => {
    let clock: sinon.SinonFakeTimers;

    beforeAll(() => {
      clock = useFakeTimers();
    });

    afterAll(() => {
      clock.restore();
    });

    it('should construct a timepoint with a given properties', () => {
      const timepoint = new TimepointEntity({
        id: '123',
        shardingFactor: 5,
        totalNotifications: 10,
        notificationTuples: [
          toTimepointNotificationTuple({
            recipientId: '123',
            notificationType:
              ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
          }),
        ],
        state: TimepointState.ACTIVE,
        processMetadata: {
          startDate: new Date(),
          expirationDate: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(timepoint.id).toEqual('123');
    });

    it('should construct a timepoint with defaults', () => {
      const timepoint = new TimepointEntity({
        id: '123',
        processMetadata: {
          startDate: new Date(),
          expirationDate: new Date(),
        },
        state: TimepointState.ACTIVE,
      });
      expect(timepoint.shardingFactor).toEqual(10);
      expect(timepoint.totalNotifications).toEqual(0);
      expect(timepoint.notificationTuples).toEqual([]);
      expect(timepoint.state).toEqual(TimepointState.ACTIVE);
      expect(timepoint.createdAt).toEqual(new Date());
      expect(timepoint.updatedAt).toEqual(new Date());
    });
  });

  describe('toTimepointNotificationTuple', () => {
    it('should return a stringified object', () => {
      const tuple = toTimepointNotificationTuple({
        recipientId: '123',
        notificationType: ScheduledNotificationType.CHALLENGE_PARTICIPANT_DAILY,
      });
      // Using hard coded value to check that the enum value is not changed
      expect(tuple).toEqual('{"rid":"123","nt":2}');
    });
  });

  describe('fromTimepointNotificationTuple', () => {
    it('should return an object', () => {
      // Using hard coded value to check that the enum value is not changed
      const tuple = fromTimepointNotificationTuple('{"rid":"123","nt":1}');
      expect(tuple).toEqual({
        recipientId: '123',
        notificationType: ScheduledNotificationType.CHALLENGE_CREATOR_DAILY,
      });
    });
  });
});
