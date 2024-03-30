import { FCMData } from '@verdzie/server/fcm/fcm.service';
import { ActivityVerb, PageRoute } from '@verdzie/server/generated-graphql';

export class NotificationContentEntity {
  id: number;
  messageData: MessageData;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id?: number;
    messageData: MessageData;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = props?.id || 0;
    this.messageData = props?.messageData || {};
    this.createdAt = props?.createdAt || new Date();
    this.updatedAt = props?.updatedAt || new Date();
  }
}

export interface MessageData {
  title: string;
  message: string;
  fcmData: FCMData;
}
