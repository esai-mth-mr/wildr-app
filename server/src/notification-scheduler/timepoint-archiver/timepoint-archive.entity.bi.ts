import {
  TimepointEntity,
  TimepointNotificationTuple,
  TimepointProcessMetadata,
  TimepointState,
} from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.entity';

export function buildTimepointArchiveFromTimepoint(
  timepoint: TimepointEntity
): TimepointArchiveEntity {
  return new TimepointArchiveEntity({
    id: timepoint.id,
    shardingFactor: timepoint.shardingFactor,
    totalNotifications: timepoint.totalNotifications,
    notificationTuples: timepoint.notificationTuples,
    processMetadata: timepoint.processMetadata,
    state: timepoint.state,
    createdAt: timepoint.createdAt,
    updatedAt: timepoint.updatedAt,
  });
}

export class TimepointArchiveEntity {
  id: string;
  shardingFactor: number;
  totalNotifications?: number;
  notificationTuples?: TimepointNotificationTuple[];
  processMetadata: TimepointProcessMetadata;
  state: TimepointState;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: string;
    shardingFactor?: number;
    totalNotifications?: number;
    notificationTuples?: TimepointNotificationTuple[];
    processMetadata: TimepointProcessMetadata;
    state: TimepointState;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props?.id || '';
    this.shardingFactor = props?.shardingFactor || 10;
    this.totalNotifications = props?.totalNotifications || 0;
    this.notificationTuples = props?.notificationTuples || [];
    this.processMetadata = props?.processMetadata;
    this.state = props?.state;
    this.createdAt = props?.createdAt || new Date();
    this.updatedAt = props?.updatedAt || new Date();
  }
}
