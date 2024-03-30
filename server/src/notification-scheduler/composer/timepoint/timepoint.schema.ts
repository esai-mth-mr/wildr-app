import { TimepointEntity } from '@verdzie/server/notification-scheduler/composer/timepoint/timepoint.entity';
import { EntitySchema } from 'typeorm';

export const TimepointSchema = new EntitySchema<TimepointEntity>({
  name: 'TimepointEntity',
  target: TimepointEntity,
  columns: {
    id: {
      name: 'id',
      type: 'text',
      primary: true,
      unique: true,
    },
    shardingFactor: {
      name: 'sharding_factor',
      type: 'int',
    },
    totalNotifications: {
      name: 'total_notifications',
      type: 'int',
      nullable: true,
    },
    notificationTuples: {
      name: 'notification_tuples',
      type: 'jsonb',
      nullable: true,
    },
    processMetadata: {
      name: 'process_metadata',
      type: 'jsonb',
    },
    state: {
      name: 'state',
      type: 'smallint',
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
  indices: [
    {
      name: 'idx_timepoint_state',
      columns: ['state'],
    },
  ],
});
