import { ScheduledNotificationType } from '@verdzie/server/notification-scheduler/notification-config/notification-config.service';

export type TimepointNotificationTuple = string;

export function toTimepointNotificationTuple({
  recipientId,
  notificationType,
}: {
  recipientId: string;
  notificationType: ScheduledNotificationType;
}): TimepointNotificationTuple {
  return JSON.stringify({
    rid: recipientId,
    nt: notificationType,
  });
}

export function fromTimepointNotificationTuple(
  tuple: TimepointNotificationTuple
): {
  recipientId: string;
  notificationType: ScheduledNotificationType;
} {
  const { rid, nt } = JSON.parse(tuple);
  return { recipientId: rid, notificationType: nt };
}

export interface TimepointProcessMetadata {
  startDate: Date;
  lastProcessedAt?: Date;
  expirationDate?: Date;
}

export enum TimepointState {
  ACTIVE = 0,
  TO_BE_ARCHIVED = 1,
}

export class TimepointEntity {
  id: string;
  shardingFactor: number;
  totalNotifications?: number;
  notificationTuples?: TimepointNotificationTuple[];
  state: TimepointState;
  processMetadata: TimepointProcessMetadata;
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
    this.state = props?.state;
    this.processMetadata = props?.processMetadata || {
      startDate: new Date(),
      lastProcessedAt: new Date(),
      expirationDate: new Date(),
    };
    this.createdAt = props?.createdAt || new Date();
    this.updatedAt = props?.updatedAt || new Date();
  }
}
