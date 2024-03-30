import { TimepointEntityFake } from '@verdzie/server/notification-scheduler/composer/timepoint/testing/timepoint-entity.fake';
import {
  TimepointArchiveEntity,
  buildTimepointArchiveFromTimepoint,
} from '@verdzie/server/notification-scheduler/timepoint-archiver/timepoint-archive.entity.bi';

describe('TimepointArchiveEntity', () => {
  describe('buildTimepointArchiveFromTimepoint', () => {
    it('should return a TimepointArchiveEntity', () => {
      const timepoint = TimepointEntityFake();
      const result = buildTimepointArchiveFromTimepoint(timepoint);
      expect(result).toBeInstanceOf(TimepointArchiveEntity);
      expect(result.id).toEqual(timepoint.id);
      expect(result.shardingFactor).toEqual(timepoint.shardingFactor);
      expect(result.totalNotifications).toEqual(timepoint.totalNotifications);
      expect(result.notificationTuples).toEqual(timepoint.notificationTuples);
      expect(result.createdAt).toEqual(timepoint.createdAt);
      expect(result.updatedAt).toEqual(timepoint.updatedAt);
    });
  });
});
