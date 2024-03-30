import { EntitySchema } from 'typeorm';
import { NotificationContentEntity } from '@verdzie/server/admin/notification/notificationContent.entity';

export const NotificationContentSchema =
  new EntitySchema<NotificationContentEntity>({
    name: 'NotificationContentEntity',
    target: NotificationContentEntity,
    columns: {
      id: {
        name: 'id',
        type: 'int',
        primary: true,
        generated: 'increment',
      },
      messageData: {
        name: 'message_data',
        type: 'json',
      },
      createdAt: {
        name: 'created_at',
        type: 'timestamp with time zone',
        createDate: true,
      },
      updatedAt: {
        name: 'updated_at',
        type: 'timestamp with time zone',
        updateDate: true,
      },
    },
  });
